#!/usr/bin/env python3
"""
Analyze a /dev:worktree command JSONL transcript for E2E correctness.

Usage: python3 analyze-e2e-transcript.py <transcript.jsonl> <checks_json>

Checks JSON format:
{
  "has_bash_command": "git worktree list",       # Exact string in Bash command
  "has_bash_command_pattern": "git (worktree|branch)",  # Regex pattern
  "has_bash_command_pattern_2": "git check-ignore",     # Second regex pattern
  "no_task_calls": true,                         # No Task tool calls
  "output_contains": "worktree",                 # String in assistant text
  "output_contains_any": ["create", "list"],     # Any of these in assistant text
  "has_skill_invocation": true,                  # Skill tool was invoked
  "skill_name_is": "dev:git-worktree"           # Specific skill name
}

Returns JSON: {"passed": true/false, "checks": [...], "summary": {...}}
"""

import json
import sys
import re

def parse_transcript(filepath):
    """Parse JSONL transcript into structured data."""
    tool_calls = []  # All tool calls in order
    bash_calls = []  # Just Bash tool calls
    task_calls = []  # Just Task tool calls
    skill_calls = []  # Just Skill tool calls
    assistant_text = []  # All assistant text output

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

                            if name == 'Bash':
                                bash_calls.append(entry)
                            elif name == 'Task':
                                task_calls.append(entry)
                            elif name == 'Skill':
                                skill_calls.append(entry)
                        elif block.get('type') == 'text':
                            assistant_text.append(block.get('text', ''))
            except json.JSONDecodeError:
                continue

    return tool_calls, bash_calls, task_calls, skill_calls, assistant_text


def run_checks(checks, tool_calls, bash_calls, task_calls, skill_calls, assistant_text):
    """Run all checks against parsed transcript data."""
    results = []

    # Check: has_bash_command
    if 'has_bash_command' in checks:
        expected_cmd = checks['has_bash_command']
        found = False
        for bc in bash_calls:
            cmd = bc['input'].get('command', '')
            if expected_cmd in cmd:
                found = True
                break
        results.append({
            'check': 'has_bash_command',
            'passed': found,
            'detail': f'Found Bash: "{expected_cmd}"' if found
                      else f'Missing Bash command: "{expected_cmd}"'
        })

    # Check: has_bash_command_pattern
    if 'has_bash_command_pattern' in checks:
        pattern = checks['has_bash_command_pattern']
        found = False
        matched_cmd = None
        for bc in bash_calls:
            cmd = bc['input'].get('command', '')
            if re.search(pattern, cmd):
                found = True
                matched_cmd = cmd[:80]
                break
        results.append({
            'check': 'has_bash_command_pattern',
            'passed': found,
            'detail': f'Matched pattern: "{pattern}" in "{matched_cmd}"' if found
                      else f'No Bash command matching pattern: "{pattern}"'
        })

    # Check: has_bash_command_pattern_2
    if 'has_bash_command_pattern_2' in checks:
        pattern = checks['has_bash_command_pattern_2']
        found = False
        matched_cmd = None
        for bc in bash_calls:
            cmd = bc['input'].get('command', '')
            if re.search(pattern, cmd):
                found = True
                matched_cmd = cmd[:80]
                break
        results.append({
            'check': 'has_bash_command_pattern_2',
            'passed': found,
            'detail': f'Matched pattern: "{pattern}" in "{matched_cmd}"' if found
                      else f'No Bash command matching pattern: "{pattern}"'
        })

    # Check: no_task_calls
    if checks.get('no_task_calls'):
        has_task = len(task_calls) > 0
        results.append({
            'check': 'no_task_calls',
            'passed': not has_task,
            'detail': 'No Task calls (correct)' if not has_task
                      else f'Found {len(task_calls)} Task calls (should be 0)'
        })

    # Check: output_contains
    if 'output_contains' in checks:
        keyword = checks['output_contains']
        full_text = ' '.join(assistant_text).lower()
        found = keyword.lower() in full_text
        results.append({
            'check': 'output_contains',
            'passed': found,
            'detail': f'Found "{keyword}" in output' if found
                      else f'Missing "{keyword}" in output'
        })

    # Check: output_contains_any
    if 'output_contains_any' in checks:
        keywords = checks['output_contains_any']
        full_text = ' '.join(assistant_text).lower()
        found_any = False
        matched_keyword = None
        for kw in keywords:
            if kw.lower() in full_text:
                found_any = True
                matched_keyword = kw
                break
        results.append({
            'check': 'output_contains_any',
            'passed': found_any,
            'detail': f'Found "{matched_keyword}" in output' if found_any
                      else f'None of {keywords} found in output'
        })

    # Check: has_skill_invocation
    if checks.get('has_skill_invocation'):
        has_skill = len(skill_calls) > 0
        results.append({
            'check': 'has_skill_invocation',
            'passed': has_skill,
            'detail': f'Found {len(skill_calls)} Skill invocation(s)' if has_skill
                      else 'No Skill tool calls found'
        })

    # Check: skill_name_is
    if 'skill_name_is' in checks:
        expected_skill = checks['skill_name_is']
        found = False
        for sc in skill_calls:
            skill_name = sc['input'].get('skill', '')
            if skill_name == expected_skill:
                found = True
                break
        results.append({
            'check': 'skill_name_is',
            'passed': found,
            'detail': f'Skill "{expected_skill}" invoked' if found
                      else f'Skill "{expected_skill}" not invoked (found: {[s["input"].get("skill") for s in skill_calls]})'
        })

    return results


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 analyze-e2e-transcript.py <transcript.jsonl> <checks_json>")
        sys.exit(1)

    transcript_path = sys.argv[1]
    checks = json.loads(sys.argv[2])

    tool_calls, bash_calls, task_calls, skill_calls, assistant_text = parse_transcript(transcript_path)

    results = run_checks(checks, tool_calls, bash_calls, task_calls, skill_calls, assistant_text)

    all_passed = all(r['passed'] for r in results)

    output = {
        'passed': all_passed,
        'checks': results,
        'summary': {
            'total_checks': len(results),
            'passed_checks': sum(1 for r in results if r['passed']),
            'failed_checks': sum(1 for r in results if not r['passed']),
            'total_tool_calls': len(tool_calls),
            'bash_calls': len(bash_calls),
            'task_calls': len(task_calls),
            'skill_calls': len(skill_calls),
            'assistant_text_blocks': len(assistant_text)
        }
    }

    print(json.dumps(output, indent=2))
    sys.exit(0 if all_passed else 1)


if __name__ == '__main__':
    main()
