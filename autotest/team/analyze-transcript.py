#!/usr/bin/env python3
"""
Analyze a /team command JSONL transcript for orchestration correctness.

Usage: python3 analyze-transcript.py <transcript.jsonl> <checks_json>

v2.0.0: Updated for Bash+claudish architecture. External models use Bash(claudish),
internal models use Task(dev:researcher). PROXY_MODE checks replaced with
Bash+claudish verification.

Checks JSON format:
{
  # Task checks (internal model)
  "task_agent_is": "dev:researcher",     # All Task calls use this agent
  "task_min_count": 2,                   # Minimum number of Task calls
  "run_in_background": true,             # Task calls use run_in_background
  "has_vote_template": true,             # Task prompt contains vote template text
  "has_vote_format": true,               # Task prompt contains vote format block
  "no_predigest": true,                  # No Read/Grep/Glob/WebSearch before first model call

  # Bash+claudish checks (external models)
  "bash_has_claudish": true,             # At least one Bash call contains "claudish"
  "bash_min_count": 2,                   # Minimum Bash claudish calls
  "bash_claudish_model_contains": "grok",# --model flag contains keyword
  "bash_claudish_has_agent": true,       # --agent flag present in claudish calls
  "bash_claudish_has_stdin": true,       # --stdin flag present
  "bash_claudish_has_output_redirect": true, # > redirect to session dir
  "bash_claudish_captures_exit": true,   # echo $? > .exit pattern
  "bash_run_in_background": true,        # Bash claudish calls use run_in_background

  # Negative checks (PROXY_MODE completely gone)
  "no_proxy_mode_in_tasks": true,        # NO Task prompts contain "PROXY_MODE"
  "no_proxy_mode_in_bash": true,         # NO Bash commands contain "PROXY_MODE"

  # Mixed model checks
  "internal_uses_task": true,            # At least one Task call (for internal)
  "external_uses_bash": true,            # External models use Bash (not Task)

  # Verification checks
  "vote_prompt_file_written": true,      # Write tool creates vote-prompt.md
  "has_post_verification_reads": true,   # Read tool checks .exit/.result files after models complete

  # Session checks
  "session_dir_pattern": "ai-docs/sessions/", # Bash mkdir uses this pattern
  "no_tmp_dir": true                     # No /tmp/ in Bash mkdir calls
}

Returns JSON: {"passed": true/false, "checks": [...], "details": {...}}
"""

import json
import sys
import re

def parse_transcript(filepath):
    """Parse JSONL transcript into structured data."""
    tool_calls = []  # All tool calls in order
    task_calls = []  # Just Task tool calls
    bash_calls = []  # Just Bash tool calls
    write_calls = []  # Just Write tool calls
    read_calls = []  # Just Read tool calls

    with open(filepath) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                if obj.get('type') == 'assistant':
                    for block in obj.get('message', {}).get('content', []):
                        if block.get('type') == 'tool_use':
                            name = block.get('name', '')
                            inp = block.get('input', {})
                            entry = {
                                'tool': name,
                                'input': inp,
                                'order': len(tool_calls)
                            }
                            tool_calls.append(entry)

                            if name == 'Task':
                                task_calls.append(entry)
                            elif name == 'Bash':
                                bash_calls.append(entry)
                            elif name == 'Write':
                                write_calls.append(entry)
                            elif name == 'Read':
                                read_calls.append(entry)
            except json.JSONDecodeError:
                continue

    return tool_calls, task_calls, bash_calls, write_calls, read_calls


def get_claudish_bash_calls(bash_calls):
    """Filter bash calls to only actual claudish model invocations.

    Only includes commands that have --model flag, which indicates a real
    model invocation. Excludes diagnostic calls like:
    - which claudish, command -v claudish, type claudish
    - claudish --help, claudish --version
    - npx claudish --help
    - cat "$(which claudish ...)"
    """
    claudish_calls = []
    for bc in bash_calls:
        cmd = bc['input'].get('command', '')
        if 'claudish' in cmd.lower() and '--model' in cmd:
            claudish_calls.append(bc)
    return claudish_calls


def run_checks(checks, tool_calls, task_calls, bash_calls, write_calls, read_calls):
    """Run all checks against parsed transcript data."""
    results = []
    claudish_calls = get_claudish_bash_calls(bash_calls)

    # ---- Task checks (internal model) ----

    # Check: task_agent_is
    if 'task_agent_is' in checks:
        expected_agent = checks['task_agent_is']
        if not task_calls:
            results.append({
                'check': 'task_agent_is',
                'passed': False,
                'detail': f'No Task calls found (expected agent: {expected_agent})'
            })
        else:
            wrong_agents = []
            for tc in task_calls:
                agent = tc['input'].get('subagent_type', 'MISSING')
                if agent != expected_agent:
                    wrong_agents.append(agent)
            if wrong_agents:
                results.append({
                    'check': 'task_agent_is',
                    'passed': False,
                    'detail': f'Wrong agents used: {wrong_agents} (expected: {expected_agent})'
                })
            else:
                results.append({
                    'check': 'task_agent_is',
                    'passed': True,
                    'detail': f'All {len(task_calls)} Task calls use {expected_agent}'
                })

    # Check: task_min_count
    if 'task_min_count' in checks:
        min_count = checks['task_min_count']
        actual = len(task_calls)
        passed = actual >= min_count
        results.append({
            'check': 'task_min_count',
            'passed': passed,
            'detail': f'{actual} Task calls (minimum: {min_count})'
        })

    # Check: run_in_background (for Task calls)
    if checks.get('run_in_background'):
        all_bg = True
        for tc in task_calls:
            if not tc['input'].get('run_in_background', False):
                all_bg = False
                break
        results.append({
            'check': 'run_in_background',
            'passed': all_bg,
            'detail': f'All {len(task_calls)} Task calls use run_in_background' if all_bg
                      else 'Some Task calls missing run_in_background=true'
        })

    # Check: has_vote_template
    if checks.get('has_vote_template'):
        found = False
        # Check Task prompts
        for tc in task_calls:
            prompt = tc['input'].get('prompt', '')
            if 'Team Vote' in prompt or 'Independent Review' in prompt:
                found = True
                break
        # Also check Write calls (vote-prompt.md)
        if not found:
            for wc in write_calls:
                content = wc['input'].get('content', '')
                if 'Team Vote' in content or 'Independent Review' in content:
                    found = True
                    break
        results.append({
            'check': 'has_vote_template',
            'passed': found,
            'detail': 'Vote template found' if found
                      else 'No vote template text found in Task prompts or Write calls'
        })

    # Check: has_vote_format
    if checks.get('has_vote_format'):
        found = False
        for tc in task_calls:
            prompt = tc['input'].get('prompt', '')
            if 'VERDICT' in prompt and ('APPROVE' in prompt or 'REJECT' in prompt):
                found = True
                break
        # Also check Write calls
        if not found:
            for wc in write_calls:
                content = wc['input'].get('content', '')
                if 'VERDICT' in content and ('APPROVE' in content or 'REJECT' in content):
                    found = True
                    break
        results.append({
            'check': 'has_vote_format',
            'passed': found,
            'detail': 'Vote format block found' if found
                      else 'No VERDICT/APPROVE/REJECT format found'
        })

    # Check: no_predigest
    if checks.get('no_predigest'):
        # Find the index of the first model call (Task or claudish Bash)
        first_model_order = 999999
        if task_calls:
            first_model_order = min(first_model_order, task_calls[0]['order'])
        if claudish_calls:
            first_model_order = min(first_model_order, claudish_calls[0]['order'])

        investigation_tools = {'Read', 'Grep', 'Glob', 'WebSearch', 'WebFetch'}
        setup_patterns = [
            'multimodel-team.json',
            'settings.json',
        ]
        predigest_calls = []
        for tc in tool_calls:
            if tc['order'] < first_model_order and tc['tool'] in investigation_tools:
                file_path = tc['input'].get('file_path', '')
                is_setup = any(pat in file_path for pat in setup_patterns)
                if not is_setup:
                    predigest_calls.append(tc['tool'])
        passed = len(predigest_calls) == 0
        results.append({
            'check': 'no_predigest',
            'passed': passed,
            'detail': f'No pre-digestion tools before model calls' if passed
                      else f'Pre-digestion detected: {predigest_calls} called before first model call'
        })

    # ---- Bash+claudish checks (external models) ----

    # Check: bash_has_claudish
    if checks.get('bash_has_claudish'):
        found = len(claudish_calls) > 0
        results.append({
            'check': 'bash_has_claudish',
            'passed': found,
            'detail': f'{len(claudish_calls)} Bash claudish calls found' if found
                      else 'No Bash calls containing "claudish" found'
        })

    # Check: bash_min_count
    if 'bash_min_count' in checks:
        min_count = checks['bash_min_count']
        actual = len(claudish_calls)
        passed = actual >= min_count
        results.append({
            'check': 'bash_min_count',
            'passed': passed,
            'detail': f'{actual} Bash claudish calls (minimum: {min_count})'
        })

    # Check: bash_claudish_model_contains
    if 'bash_claudish_model_contains' in checks:
        keyword = checks['bash_claudish_model_contains']
        found = False
        detail = ''
        for bc in claudish_calls:
            cmd = bc['input'].get('command', '')
            if keyword.lower() in cmd.lower():
                # Try to extract the --model value
                model_match = re.search(r'--model\s+(\S+)', cmd)
                if model_match:
                    found = True
                    detail = f'Found: --model {model_match.group(1)}'
                    break
                elif keyword.lower() in cmd.lower():
                    found = True
                    detail = f'Found "{keyword}" in claudish command'
                    break
        if not found:
            detail = f'No claudish command containing "{keyword}" in --model'
        results.append({
            'check': 'bash_claudish_model_contains',
            'passed': found,
            'detail': detail
        })

    # Check: bash_claudish_has_agent
    if checks.get('bash_claudish_has_agent'):
        any_have_agent = any('--agent' in bc['input'].get('command', '') for bc in claudish_calls)
        results.append({
            'check': 'bash_claudish_has_agent',
            'passed': any_have_agent,
            'detail': f'At least one claudish call has --agent ({len(claudish_calls)} total)' if any_have_agent
                      else 'Missing --agent in all claudish calls' if claudish_calls
                      else 'No claudish calls found'
        })

    # Check: bash_claudish_has_stdin
    if checks.get('bash_claudish_has_stdin'):
        # Accept --stdin OR -p/--prompt as valid input methods (retries may use -p)
        any_have_stdin = any('--stdin' in bc['input'].get('command', '') for bc in claudish_calls)
        results.append({
            'check': 'bash_claudish_has_stdin',
            'passed': any_have_stdin,
            'detail': f'At least one claudish call has --stdin ({len(claudish_calls)} total)' if any_have_stdin
                      else 'Missing --stdin in all claudish calls' if claudish_calls
                      else 'No claudish calls found'
        })

    # Check: bash_claudish_has_output_redirect
    if checks.get('bash_claudish_has_output_redirect'):
        any_have_redirect = any(
            re.search(r'[^2]>\s*\S+\.md', bc['input'].get('command', '')) or
            re.search(r'^>\s*\S+\.md', bc['input'].get('command', ''))
            for bc in claudish_calls
        )
        results.append({
            'check': 'bash_claudish_has_output_redirect',
            'passed': any_have_redirect,
            'detail': f'At least one claudish call redirects output to .md' if any_have_redirect
                      else 'Missing output redirect in all claudish calls' if claudish_calls
                      else 'No claudish calls found'
        })

    # Check: bash_claudish_captures_exit
    if checks.get('bash_claudish_captures_exit'):
        any_capture_exit = any(
            re.search(r'echo\s+\$\?\s*>\s*\S+\.exit', bc['input'].get('command', ''))
            for bc in claudish_calls
        )
        results.append({
            'check': 'bash_claudish_captures_exit',
            'passed': any_capture_exit,
            'detail': f'At least one claudish call captures exit code' if any_capture_exit
                      else 'Missing exit code capture (echo $? > .exit)' if claudish_calls
                      else 'No claudish calls found'
        })

    # Check: bash_run_in_background
    if checks.get('bash_run_in_background'):
        any_bg = any(bc['input'].get('run_in_background', False) for bc in claudish_calls)
        results.append({
            'check': 'bash_run_in_background',
            'passed': any_bg,
            'detail': f'At least one claudish Bash call uses run_in_background ({len(claudish_calls)} total)' if any_bg
                      else 'No claudish Bash calls have run_in_background=true' if claudish_calls
                      else 'No claudish calls found'
        })

    # ---- Negative checks (PROXY_MODE completely gone) ----

    # Check: no_proxy_mode_in_tasks
    if checks.get('no_proxy_mode_in_tasks'):
        has_proxy = False
        for tc in task_calls:
            prompt = tc['input'].get('prompt', '')
            if 'PROXY_MODE' in prompt:
                has_proxy = True
                break
        results.append({
            'check': 'no_proxy_mode_in_tasks',
            'passed': not has_proxy,
            'detail': 'No PROXY_MODE in any Task prompts' if not has_proxy
                      else 'Found PROXY_MODE in Task prompt (should be removed)'
        })

    # Check: no_proxy_mode_in_bash
    if checks.get('no_proxy_mode_in_bash'):
        has_proxy = False
        for bc in bash_calls:
            cmd = bc['input'].get('command', '')
            if 'PROXY_MODE' in cmd:
                has_proxy = True
                break
        results.append({
            'check': 'no_proxy_mode_in_bash',
            'passed': not has_proxy,
            'detail': 'No PROXY_MODE in any Bash commands' if not has_proxy
                      else 'Found PROXY_MODE in Bash command (should be removed)'
        })

    # ---- Mixed model checks ----

    # Check: internal_uses_task
    if checks.get('internal_uses_task'):
        has_task = len(task_calls) > 0
        results.append({
            'check': 'internal_uses_task',
            'passed': has_task,
            'detail': f'{len(task_calls)} Task calls found (for internal model)' if has_task
                      else 'No Task calls found (internal model should use Task)'
        })

    # Check: external_uses_bash
    if checks.get('external_uses_bash'):
        has_claudish = len(claudish_calls) > 0
        results.append({
            'check': 'external_uses_bash',
            'passed': has_claudish,
            'detail': f'{len(claudish_calls)} Bash claudish calls found (for external models)' if has_claudish
                      else 'No Bash claudish calls found (external models should use Bash+claudish)'
        })

    # ---- Verification checks ----

    # Check: vote_prompt_file_written
    if checks.get('vote_prompt_file_written'):
        found = False
        for wc in write_calls:
            file_path = wc['input'].get('file_path', '')
            if 'vote-prompt' in file_path or 'vote_prompt' in file_path:
                found = True
                break
        results.append({
            'check': 'vote_prompt_file_written',
            'passed': found,
            'detail': 'vote-prompt file written via Write tool' if found
                      else 'No Write call for vote-prompt file found'
        })

    # Check: has_post_verification_reads
    if checks.get('has_post_verification_reads'):
        # Find the last model call order
        last_model_order = 0
        for tc in task_calls:
            last_model_order = max(last_model_order, tc['order'])
        for bc in claudish_calls:
            last_model_order = max(last_model_order, bc['order'])

        # Check if there are Read calls after the last model call
        post_reads = []
        for rc in read_calls:
            if rc['order'] > last_model_order:
                file_path = rc['input'].get('file_path', '')
                if '.exit' in file_path or 'result' in file_path or 'stderr' in file_path:
                    post_reads.append(file_path)
        passed = len(post_reads) > 0
        results.append({
            'check': 'has_post_verification_reads',
            'passed': passed,
            'detail': f'{len(post_reads)} verification reads after model calls' if passed
                      else 'No verification reads (.exit/.result files) found after model calls'
        })

    # ---- Session checks ----

    # Check: session_dir_pattern
    if 'session_dir_pattern' in checks:
        pattern = checks['session_dir_pattern']
        found = False
        for bc in bash_calls:
            cmd = bc['input'].get('command', '')
            if 'mkdir' in cmd and pattern in cmd:
                found = True
                break
        results.append({
            'check': 'session_dir_pattern',
            'passed': found,
            'detail': f'Session dir with "{pattern}" found in mkdir' if found
                      else f'No mkdir with "{pattern}" found in Bash calls'
        })

    # Check: no_tmp_dir
    if checks.get('no_tmp_dir'):
        has_tmp = False
        for bc in bash_calls:
            cmd = bc['input'].get('command', '')
            if 'mkdir' in cmd and '/tmp/' in cmd:
                has_tmp = True
                break
        for tc in task_calls:
            prompt = tc['input'].get('prompt', '')
            if '/tmp/' in prompt:
                has_tmp = True
                break
        results.append({
            'check': 'no_tmp_dir',
            'passed': not has_tmp,
            'detail': 'No /tmp/ paths found' if not has_tmp
                      else 'Found /tmp/ path in Bash mkdir or Task prompt'
        })

    return results


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 analyze-transcript.py <transcript.jsonl> <checks_json>")
        sys.exit(1)

    transcript_path = sys.argv[1]
    checks = json.loads(sys.argv[2])

    tool_calls, task_calls, bash_calls, write_calls, read_calls = parse_transcript(transcript_path)

    results = run_checks(checks, tool_calls, task_calls, bash_calls, write_calls, read_calls)

    all_passed = all(r['passed'] for r in results)

    output = {
        'passed': all_passed,
        'checks': results,
        'summary': {
            'total_checks': len(results),
            'passed_checks': sum(1 for r in results if r['passed']),
            'failed_checks': sum(1 for r in results if not r['passed']),
            'total_tool_calls': len(tool_calls),
            'task_calls': len(task_calls),
            'bash_calls': len(bash_calls),
            'claudish_calls': len(get_claudish_bash_calls(bash_calls)),
            'write_calls': len(write_calls),
            'read_calls': len(read_calls)
        }
    }

    print(json.dumps(output, indent=2))
    sys.exit(0 if all_passed else 1)


if __name__ == '__main__':
    main()
