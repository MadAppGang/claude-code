#!/bin/bash
# Claude Code Status Line — colorful worktree-aware status with plan limits & reset countdowns
# Receives JSON session data via stdin
# Part of statusline plugin (MadAppGang/claude-code)

input=$(cat)

# ── Config file (optional) ───────────────────────────────
CONFIG_FILE="$HOME/.claude/statusline-config.json"

SHOW_MODEL=true
SHOW_BRANCH=true
SHOW_WORKTREE=true
SHOW_COST=true
SHOW_DURATION=true
SHOW_CONTEXT_BAR=true
SHOW_PLAN_LIMITS=true
CTX_BAR_WIDTH=12
PLAN_BAR_WIDTH=10
THEME="default"

if [ -f "$CONFIG_FILE" ] && command -v jq >/dev/null 2>&1; then
  eval "$(jq -r '
    def d(v; fallback): if v == null then fallback else v end;
    "SHOW_MODEL=\(d(.sections.model; true))",
    "SHOW_BRANCH=\(d(.sections.branch; true))",
    "SHOW_WORKTREE=\(d(.sections.worktree; true))",
    "SHOW_COST=\(d(.sections.cost; true))",
    "SHOW_DURATION=\(d(.sections.duration; true))",
    "SHOW_CONTEXT_BAR=\(d(.sections.context_bar; true))",
    "SHOW_PLAN_LIMITS=\(d(.sections.plan_limits; true))",
    "CTX_BAR_WIDTH=\(d(.context_bar_width; 12))",
    "PLAN_BAR_WIDTH=\(d(.plan_bar_width; 10))",
    "THEME=\(d(.theme; "default"))"
  ' "$CONFIG_FILE" 2>/dev/null)"
fi

# ── Theme colors ─────────────────────────────────────────
apply_theme() {
  B='\033[1m'
  D='\033[2m'
  R='\033[0m'

  case "$THEME" in
    monochrome)
      C_CYAN='\033[97m'
      C_GREEN='\033[37m'
      C_YELLOW='\033[37m'
      C_RED='\033[97m'
      C_MAGENTA='\033[37m'
      C_WHITE='\033[97m'
      C_GRAY='\033[90m'
      C_ORANGE='\033[97m'
      ;;
    minimal)
      C_CYAN='\033[36m'
      C_GREEN='\033[32m'
      C_YELLOW='\033[33m'
      C_RED='\033[31m'
      C_MAGENTA='\033[35m'
      C_WHITE='\033[37m'
      C_GRAY='\033[90m'
      C_ORANGE='\033[33m'
      ;;
    neon)
      C_CYAN='\033[38;5;51m'
      C_GREEN='\033[38;5;46m'
      C_YELLOW='\033[38;5;226m'
      C_RED='\033[38;5;196m'
      C_MAGENTA='\033[38;5;201m'
      C_WHITE='\033[38;5;231m'
      C_GRAY='\033[38;5;240m'
      C_ORANGE='\033[38;5;208m'
      ;;
    *)  # default — warm/cool palette
      C_CYAN='\033[96m'
      C_GREEN='\033[92m'
      C_YELLOW='\033[93m'
      C_RED='\033[91m'
      C_MAGENTA='\033[95m'
      C_WHITE='\033[97m'
      C_GRAY='\033[90m'
      C_ORANGE='\033[38;5;208m'
      ;;
  esac
}
apply_theme

# ── Helpers ───────────────────────────────────────────────
color_for_pct() {
  local p=$1
  if [ "$p" -lt 40 ]; then   printf '%s' "$C_GREEN"
  elif [ "$p" -lt 70 ]; then printf '%s' "$C_YELLOW"
  elif [ "$p" -lt 90 ]; then printf '%s' "$C_ORANGE"
  else                       printf '%s' "$C_RED"
  fi
}

plan_color_for_pct() {
  local p=$1
  if [ "$p" -lt 50 ]; then   printf '%s' '\033[36m'       # teal
  elif [ "$p" -lt 75 ]; then printf '%s' '\033[34m'       # blue
  elif [ "$p" -lt 90 ]; then printf '%s' '\033[38;5;172m' # orange
  else                       printf '%s' '\033[31m'       # red
  fi
}

repeat_char() {
  local n=$1 ch=$2
  [ "$n" -le 0 ] && return
  printf "%${n}s" | tr ' ' "$ch"
}

# Convert ISO 8601 timestamp to human-friendly countdown
countdown() {
  local reset_ts="$1"
  [ -z "$reset_ts" ] && return

  # Strip fractional seconds and timezone suffix for parsing
  local clean="${reset_ts%%.*}"
  clean="${clean%%Z}"
  clean="${clean%%+*}"

  # macOS date -jf; fall back to GNU date -d
  local reset_epoch
  reset_epoch=$(date -jf "%Y-%m-%dT%H:%M:%S" "$clean" +%s 2>/dev/null)
  if [ -z "$reset_epoch" ]; then
    reset_epoch=$(date -d "$reset_ts" +%s 2>/dev/null)
  fi
  [ -z "$reset_epoch" ] && return

  local now diff h m
  now=$(date +%s)
  diff=$((reset_epoch - now))
  [ "$diff" -le 0 ] && { printf "now"; return; }

  h=$((diff / 3600))
  m=$(((diff % 3600) / 60))

  if [ "$h" -ge 24 ]; then
    printf "%dd%dh" $((h / 24)) $((h % 24))
  elif [ "$h" -gt 0 ]; then
    printf "%dh%dm" "$h" "$m"
  else
    printf "%dm" "$m"
  fi
}

# Format token count as human-readable (e.g., 184320 → 184k)
fmt_tokens() {
  local t=$1
  [ -z "$t" ] || [ "$t" = "null" ] || [ "$t" -eq 0 ] 2>/dev/null && return
  local k=$((t / 1000))
  printf "%dk" "$k"
}

# ── Extract session data ──────────────────────────────────
MODEL=$(echo "$input" | jq -r '.model.display_name // "unknown"')
COST=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
PCT=$(echo "$input" | jq -r '.context_window.used_percentage // 0' | cut -d. -f1)
CWD=$(echo "$input" | jq -r '.cwd // ""')
DURATION_MS=$(echo "$input" | jq -r '.cost.total_duration_ms // 0')
CTX_MAX_TOKENS=$(echo "$input" | jq -r '.context_window.context_window_size // 0')
TOTAL_INPUT_TOKENS=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0')
SESSION_ID=$(echo "$input" | jq -r '.session_id // ""')

# ── Shorten model name ────────────────────────────────────
case "$MODEL" in
  *"Opus"*)    MODEL_SHORT="Opus" ;;
  *"Sonnet"*)  MODEL_SHORT="Sonnet" ;;
  *"Haiku"*)   MODEL_SHORT="Haiku" ;;
  *)           MODEL_SHORT="$MODEL" ;;
esac

# ── Format cost ───────────────────────────────────────────
COST_FMT=$(printf '%.2f' "$COST")

# ── Format duration ───────────────────────────────────────
MINS=$((DURATION_MS / 60000))
SECS=$(((DURATION_MS % 60000) / 1000))
if [ "$MINS" -gt 0 ]; then
  DURATION="${MINS}m${SECS}s"
else
  DURATION="${SECS}s"
fi

# ── Git branch + worktree detection ──────────────────────
BRANCH=""
WORKTREE_NAME=""

if [ -n "$CWD" ] && cd "$CWD" 2>/dev/null && git rev-parse --git-dir >/dev/null 2>&1; then
  BRANCH=$(git branch --show-current 2>/dev/null)
  [ -z "$BRANCH" ] && BRANCH=$(git rev-parse --short HEAD 2>/dev/null)

  GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)
  GIT_COMMON=$(git rev-parse --git-common-dir 2>/dev/null)
  GIT_DIR=$(cd "$GIT_DIR" 2>/dev/null && pwd)
  GIT_COMMON=$(cd "$GIT_COMMON" 2>/dev/null && pwd)

  if [ "$GIT_DIR" != "$GIT_COMMON" ]; then
    WORKTREE_NAME=$(basename "$CWD")
  fi
fi

# ── Context bar ───────────────────────────────────────────
BAR_WIDTH=$CTX_BAR_WIDTH
CTX_F=$((PCT * BAR_WIDTH / 100))
[ "$CTX_F" -gt "$BAR_WIDTH" ] && CTX_F=$BAR_WIDTH
CTX_E=$((BAR_WIDTH - CTX_F))

BAR_COLOR=$(color_for_pct "$PCT")

# ── Plan usage limits (non-blocking cache) ────────────────
USAGE_CACHE="$HOME/.claude/.statusline-usage-cache.json"
CACHE_TTL=60
FIVE_HR=""
SEVEN_DAY=""
FIVE_HR_RESET=""
SEVEN_DAY_RESET=""

NEED_REFRESH=0
if [ ! -f "$USAGE_CACHE" ]; then
  NEED_REFRESH=1
else
  CACHE_MTIME=$(stat -f %m "$USAGE_CACHE" 2>/dev/null || echo 0)
  NOW=$(date +%s)
  [ $((NOW - CACHE_MTIME)) -gt "$CACHE_TTL" ] && NEED_REFRESH=1
fi

if [ "$NEED_REFRESH" -eq 1 ]; then
  (
    TOKEN=$(security find-generic-password -s "Claude Code-credentials" -w 2>/dev/null | jq -r '.claudeAiOauth.accessToken // empty' 2>/dev/null)
    if [ -n "$TOKEN" ]; then
      curl -s --max-time 3 \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -H "anthropic-beta: oauth-2025-04-20" \
        "https://api.anthropic.com/api/oauth/usage" > "${USAGE_CACHE}.tmp" 2>/dev/null \
      && mv "${USAGE_CACHE}.tmp" "$USAGE_CACHE"
    fi
  ) &
fi

if [ -f "$USAGE_CACHE" ]; then
  FIVE_HR=$(jq -r '.five_hour.utilization // empty' "$USAGE_CACHE" 2>/dev/null | cut -d. -f1)
  SEVEN_DAY=$(jq -r '.seven_day.utilization // empty' "$USAGE_CACHE" 2>/dev/null | cut -d. -f1)
  FIVE_HR_RESET=$(jq -r '.five_hour.resets_at // empty' "$USAGE_CACHE" 2>/dev/null)
  SEVEN_DAY_RESET=$(jq -r '.seven_day.resets_at // empty' "$USAGE_CACHE" 2>/dev/null)
fi

# ── Compute reset countdowns ────────────────────────────
FIVE_HR_CD=""
SEVEN_DAY_CD=""
if [ -n "$FIVE_HR_RESET" ]; then
  FIVE_HR_CD=$(countdown "$FIVE_HR_RESET")
fi
if [ -n "$SEVEN_DAY_RESET" ]; then
  SEVEN_DAY_CD=$(countdown "$SEVEN_DAY_RESET")
fi

# ── Separator ─────────────────────────────────────────────
SEP="${C_GRAY}|${R}"

# ── Build output (section-gated with smart separators) ────
OUT=""
NEED_SEP=0

append_section() {
  if [ "$NEED_SEP" -eq 1 ]; then
    OUT="${OUT} ${SEP} "
  fi
  OUT="${OUT}$1"
  NEED_SEP=1
}

# Model
if [ "$SHOW_MODEL" = "true" ]; then
  append_section "${B}${C_CYAN}* ${MODEL_SHORT}${R}"
fi

# Branch
if [ "$SHOW_BRANCH" = "true" ] && [ -n "$BRANCH" ]; then
  append_section "${C_GREEN}${BRANCH}${R}"
fi

# Worktree
if [ "$SHOW_WORKTREE" = "true" ] && [ -n "$WORKTREE_NAME" ]; then
  append_section "${B}${C_ORANGE}wt:${WORKTREE_NAME}${R}"
fi

# Cost
if [ "$SHOW_COST" = "true" ]; then
  append_section "${C_YELLOW}\$${COST_FMT}${R}"
fi

# Duration
if [ "$SHOW_DURATION" = "true" ]; then
  append_section "${C_MAGENTA}${DURATION}${R}"
fi

# Context bar — █ filled, ░ empty, with token count and compaction detection
if [ "$SHOW_CONTEXT_BAR" = "true" ]; then
  CTX_SECTION="${BAR_COLOR}$(repeat_char "$CTX_F" '█')${C_GRAY}$(repeat_char "$CTX_E" '░')${R} ${BAR_COLOR}${PCT}%%${R}"

  # Token count (e.g., 156k/200k) — derived from percentage to stay consistent
  # Note: total_input_tokens is cumulative (grows past window size after compaction)
  CTX_USED_TOKENS=0
  if [ "$CTX_MAX_TOKENS" -gt 0 ] 2>/dev/null; then
    CTX_USED_TOKENS=$((PCT * CTX_MAX_TOKENS / 100))
  fi
  CTX_USED_FMT=$(fmt_tokens "$CTX_USED_TOKENS")
  CTX_MAX_FMT=$(fmt_tokens "$CTX_MAX_TOKENS")
  if [ -n "$CTX_USED_FMT" ] && [ -n "$CTX_MAX_FMT" ]; then
    CTX_SECTION="${CTX_SECTION} ${C_GRAY}${D}${CTX_USED_FMT}/${CTX_MAX_FMT}${R}"
  fi

  # Compaction detection — compare total_input_tokens with cached value
  # Per-session cache (keyed by session_id) to avoid cross-session false positives
  COMPACTED=""
  if [ -n "$SESSION_ID" ] && [ "$TOTAL_INPUT_TOKENS" -gt 0 ] 2>/dev/null; then
    TOKEN_CACHE="$HOME/.claude/.statusline-token-cache-${SESSION_ID}"
    PREV_TOKENS=$(cat "$TOKEN_CACHE" 2>/dev/null || echo 0)
    if [ "$PREV_TOKENS" -gt 0 ] && [ "$TOTAL_INPUT_TOKENS" -lt "$PREV_TOKENS" ]; then
      COMPACTED=1
    fi
    echo "$TOTAL_INPUT_TOKENS" > "$TOKEN_CACHE"
  fi

  if [ -n "$COMPACTED" ]; then
    CTX_SECTION="${CTX_SECTION} ${C_MAGENTA}${B}⟳${R}"
  fi

  # Compaction warning — ⚡ when context is critically high (≥80%)
  if [ "$PCT" -ge 80 ] 2>/dev/null; then
    CTX_SECTION="${CTX_SECTION} ${C_RED}${B}⚡${R}"
  fi

  append_section "$CTX_SECTION"
fi

# ── Plan dual bar (half-blocks, batched by section) ───────
# top=5h bottom=7d: █=both ▀=5h-only ▄=7d-only -=empty
if [ "$SHOW_PLAN_LIMITS" = "true" ] && [ -n "$FIVE_HR" ] && [ -n "$SEVEN_DAY" ]; then
  PLAN_W=$PLAN_BAR_WIDTH
  N_5H=$((FIVE_HR * PLAN_W / 100))
  N_7D=$((SEVEN_DAY * PLAN_W / 100))
  [ "$N_5H" -gt "$PLAN_W" ] && N_5H=$PLAN_W
  [ "$N_7D" -gt "$PLAN_W" ] && N_7D=$PLAN_W

  MIN_N=$N_5H; MAX_N=$N_7D; MID_CH='▄'
  if [ "$N_5H" -gt "$N_7D" ]; then
    MIN_N=$N_7D; MAX_N=$N_5H; MID_CH='▀'
  fi
  N_BOTH=$MIN_N
  N_MID=$((MAX_N - MIN_N))
  N_EMPTY=$((PLAN_W - MAX_N))

  MAX_P=$FIVE_HR
  [ "$SEVEN_DAY" -gt "$MAX_P" ] && MAX_P=$SEVEN_DAY
  P_COLOR=$(plan_color_for_pct "$MAX_P")

  FH_C=$(plan_color_for_pct "$FIVE_HR")
  SD_C=$(plan_color_for_pct "$SEVEN_DAY")

  PBAR="${P_COLOR}$(repeat_char "$N_BOTH" '█')$(repeat_char "$N_MID" "$MID_CH")${R}${C_GRAY}${D}$(repeat_char "$N_EMPTY" '-')${R}"

  # Build labels with optional reset countdowns
  # Primary: bright percentage | Secondary: dim countdown
  FH_LABEL="${FH_C}${D}5h${R}${FH_C}:${FIVE_HR}%%${R}"
  if [ -n "$FIVE_HR_CD" ]; then
    FH_LABEL="${FH_LABEL} ${C_GRAY}${D}↻${FIVE_HR_CD}${R}"
  fi

  SD_LABEL="${SD_C}${D}7d${R}${SD_C}:${SEVEN_DAY}%%${R}"
  if [ -n "$SEVEN_DAY_CD" ]; then
    SD_LABEL="${SD_LABEL} ${C_GRAY}${D}↻${SEVEN_DAY_CD}${R}"
  fi

  append_section "${PBAR} ${FH_LABEL} ${SD_LABEL}"
fi

printf "${OUT}\n"
