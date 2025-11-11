# Claude Code Streaming Protocol - Complete Explanation

> **Visual guide** to understanding how Server-Sent Events (SSE) streaming works in Claude Code.
>
> Based on real captured traffic from monitor mode.

---

## How Streaming Communication Works

### The Big Picture

```
Claude Code                    Claudish Proxy              Anthropic API
    |                                |                           |
    |------ POST /v1/messages ------>|                           |
    |  (JSON request body)           |                           |
    |                                |------ POST /v1/messages ->|
    |                                |  (same JSON body)         |
    |                                |                           |
    |                                |<----- SSE Stream ---------|
    |                                |  (text/event-stream)      |
    |<----- SSE Stream --------------|                           |
    |  (forwarded as-is)             |                           |
    |                                |                           |
    |  [Reading events...]           |  [Logging events...]      |
    |                                |                           |
```

---

## SSE (Server-Sent Events) Format

### What is SSE?

SSE is a standard for streaming text data from server to client over HTTP:

```
Content-Type: text/event-stream

event: event_name
data: {"json":"data"}

event: another_event
data: {"more":"data"}

```

**Key Characteristics:**
- Plain text protocol
- Events separated by blank lines (`\n\n`)
- Each event has `event:` and `data:` lines
- Connection stays open

---

## Complete Streaming Sequence (Real Example)

### Step 1: Client Sends Request

**Claude Code → Proxy:**
```http
POST /v1/messages HTTP/1.1
Host: 127.0.0.1:5285
Content-Type: application/json
authorization: Bearer sk-ant-oat01-...
anthropic-beta: oauth-2025-04-20,interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14

{
  "model": "claude-haiku-4-5-20251001",
  "messages": [{
    "role": "user",
    "content": [{"type": "text", "text": "Analyze this codebase"}]
  }],
  "max_tokens": 32000,
  "stream": true
}
```

### Step 2: Server Responds with SSE

**Anthropic API → Proxy → Claude Code:**

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

event: message_start
data: {"type":"message_start","message":{"id":"msg_01ABC","model":"claude-haiku-4-5-20251001","usage":{"input_tokens":3,"cache_creation_input_tokens":5501}}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"I"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"'m ready to help you search"}}

event: ping
data: {"type":"ping"}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" and analyze the"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" codebase."}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":12}}

event: message_stop
data: {"type":"message_stop"}

```

### Step 3: Client Reconstructs Response

**Claude Code processes events:**

```javascript
let fullText = "";
let messageId = "";
let usage = {};

// Read SSE stream
stream.on('event:message_start', (data) => {
  messageId = data.message.id;
  usage = data.message.usage;
});

stream.on('event:content_block_delta', (data) => {
  if (data.delta.type === 'text_delta') {
    fullText += data.delta.text;
    // Display incrementally to user
    console.log(data.delta.text);
  }
});

stream.on('event:message_stop', () => {
  // Complete! Final text: "I'm ready to help you search and analyze the codebase."
});
```

---

## Event Types Explained

### 1. `message_start` - Initialize Message

**When:** First event in every stream

**Purpose:** Provide message metadata and usage stats

**Example:**
```json
{
  "type": "message_start",
  "message": {
    "id": "msg_01Bnhgy47DDidiGYfAEX5zkm",
    "model": "claude-haiku-4-5-20251001",
    "role": "assistant",
    "content": [],
    "usage": {
      "input_tokens": 3,
      "cache_creation_input_tokens": 5501,
      "cache_read_input_tokens": 0,
      "output_tokens": 1
    }
  }
}
```

**What Claude Code Does:**
- Extracts message ID
- Records cache metrics (important for cost tracking!)
- Initializes content array

### 2. `content_block_start` - Begin Content Block

**When:** Starting a new text or tool block

**Purpose:** Declare block type

**Example (Text Block):**
```json
{
  "type": "content_block_start",
  "index": 0,
  "content_block": {
    "type": "text",
    "text": ""
  }
}
```

**Example (Tool Block):**
```json
{
  "type": "content_block_start",
  "index": 1,
  "content_block": {
    "type": "tool_use",
    "id": "toolu_01XYZ",
    "name": "Read",
    "input": {}
  }
}
```

**What Claude Code Does:**
- Creates new content block
- Prepares to receive deltas
- Displays block header if needed

### 3. `content_block_delta` - Stream Content

**When:** Incrementally sending content

**Purpose:** Send text/tool input piece by piece

**Text Delta:**
```json
{
  "type": "content_block_delta",
  "index": 0,
  "delta": {
    "type": "text_delta",
    "text": "I'm ready to help"
  }
}
```

**Tool Input Delta:**
```json
{
  "type": "content_block_delta",
  "index": 1,
  "delta": {
    "type": "input_json_delta",
    "partial_json": "{\"file_path\":\"/Users/"
  }
}
```

**What Claude Code Does:**
- **Text:** Append to buffer, display immediately
- **Tool Input:** Concatenate JSON fragments

**Streaming Granularity:**
```
Real example from logs:

Delta 1: "I"
Delta 2: "'m ready to help you search"
Delta 3: " an"
Delta 4: "d analyze the"
Delta 5: " codebase. I have access"
...
```

Very fine-grained! Each delta is 1-20 characters.

### 4. `ping` - Keep Alive

**When:** Periodically during long streams

**Purpose:** Prevent connection timeout

**Example:**
```json
{
  "type": "ping"
}
```

**What Claude Code Does:**
- Ignores (doesn't affect content)
- Resets timeout timer

### 5. `content_block_stop` - End Content Block

**When:** Content block is complete

**Purpose:** Signal block finished

**Example:**
```json
{
  "type": "content_block_stop",
  "index": 0
}
```

**What Claude Code Does:**
- Finalizes block
- Moves to next block if any

### 6. `message_delta` - Update Message Metadata

**When:** Near end of stream

**Purpose:** Provide stop_reason and final usage

**Example:**
```json
{
  "type": "message_delta",
  "delta": {
    "stop_reason": "end_turn",
    "stop_sequence": null
  },
  "usage": {
    "output_tokens": 145
  }
}
```

**Stop Reasons:**
- `end_turn` - Normal completion
- `max_tokens` - Hit token limit
- `tool_use` - Wants to call tools
- `stop_sequence` - Hit stop sequence

**What Claude Code Does:**
- Records why stream ended
- Updates final token count
- Determines next action

### 7. `message_stop` - End Stream

**When:** Final event

**Purpose:** Signal stream complete

**Example:**
```json
{
  "type": "message_stop"
}
```

**What Claude Code Does:**
- Closes connection
- Returns control to user
- Or executes tools if `stop_reason: "tool_use"`

---

## Tool Call Streaming (Fine-Grained)

### Text Block Then Tool Block

```
event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"I'll read the file."}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: content_block_start
data: {"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"toolu_01ABC","name":"Read","input":{}}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\"file"}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"_path\":\"/Users/jack/package.json\"}"}}

event: content_block_stop
data: {"type":"content_block_stop","index":1}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"tool_use"},"usage":{"output_tokens":45}}

event: message_stop
data: {"type":"message_stop"}
```

### Reconstructing Tool Input

```javascript
let toolInput = "";

// Receive deltas
toolInput += "{\"file";              // Delta 1
toolInput += "_path\":\"/Users/jack/package.json\"}";  // Delta 2

// Parse complete JSON
const params = JSON.parse(toolInput);
// Result: {file_path: "/Users/jack/package.json"}

// Execute tool
const result = await readFile(params.file_path);

// Send tool_result in next request
```

---

## Why Streaming?

### Benefits

1. **Immediate Feedback**
   - User sees response appear word-by-word
   - Better UX than waiting for complete response

2. **Reduced Latency**
   - No need to wait for full generation
   - Can start displaying/processing immediately

3. **Tool Calls Visible**
   - User sees "thinking" process
   - Tool calls stream as they're generated

4. **Better Error Handling**
   - Can detect errors mid-stream
   - Connection issues obvious

### Drawbacks

1. **Complex Parsing**
   - Must handle partial JSON
   - Event order matters
   - Concatenation required

2. **Connection Management**
   - Must handle disconnects
   - Timeouts need management
   - Reconnection logic needed

3. **Buffering Challenges**
   - Character encoding issues
   - Partial UTF-8 characters
   - Line boundary detection

---

## How Claudish Handles Streaming

### Monitor Mode (Pass-Through)

```typescript
// proxy-server.ts:194-247

if (contentType.includes("text/event-stream")) {
  return c.body(
    new ReadableStream({
      async start(controller) {
        const reader = anthropicResponse.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let eventLog = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Pass through to Claude Code immediately
          controller.enqueue(value);

          // Also log for analysis
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim()) {
              eventLog += line + "\n";
            }
          }
        }

        // Log complete stream
        log(eventLog);
        controller.close();
      },
    })
  );
}
```

**Key Points:**
1. **Pass-through:** Forward bytes immediately to Claude Code
2. **No modification:** Don't parse or transform
3. **Logging:** Decode and log for analysis
4. **Line buffering:** Handle partial lines correctly

### OpenRouter Mode (Translation)

```typescript
// proxy-server.ts:583-896

// Send initial events IMMEDIATELY
sendSSE("message_start", {...});
sendSSE("content_block_start", {...});
sendSSE("ping", {...});

// Read OpenRouter stream
const reader = openrouterResponse.body?.getReader();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";

  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;

    const data = JSON.parse(line.slice(6));

    if (data.choices[0].delta.content) {
      // Send text delta
      sendSSE("content_block_delta", {
        type: "content_block_delta",
        index: 0,
        delta: {
          type: "text_delta",
          text: data.choices[0].delta.content
        }
      });
    }

    if (data.choices[0].delta.tool_calls) {
      // Send tool input deltas
      // ...complex tool streaming logic
    }
  }
}

// Send final events
sendSSE("content_block_stop", {...});
sendSSE("message_delta", {...});
sendSSE("message_stop", {...});
```

**Key Points:**
1. **OpenAI → Anthropic:** Transform event format
2. **Buffer management:** Handle partial lines
3. **Tool call mapping:** Convert OpenAI tool format
4. **Immediate events:** Send message_start before first chunk

---

## Real Example: Word-by-Word Assembly

From our logs, here's how one sentence streams:

```
Original sentence: "I'm ready to help you search and analyze the codebase."

Delta 1:  "I"
Delta 2:  "'m ready to help you search"
Delta 3:  " an"
Delta 4:  "d analyze the"
Delta 5:  " codebase."

Assembled: "I" + "'m ready to help you search" + " an" + "d analyze the" + " codebase."
Result:    "I'm ready to help you search and analyze the codebase."
```

**Why so granular?**
- Model generates text incrementally
- Anthropic sends immediately (low latency)
- Network packets don't align with word boundaries
- Fine-grained streaming beta feature

---

## Cache Metrics in Streaming

### First Call (Creates Cache)

```
event: message_start
data: {
  "usage": {
    "input_tokens": 3,
    "cache_creation_input_tokens": 5501,
    "cache_read_input_tokens": 0,
    "cache_creation": {
      "ephemeral_5m_input_tokens": 5501
    }
  }
}
```

**Meaning:**
- Read 3 new tokens
- Wrote 5501 tokens to cache (5-minute TTL)
- Cache will be available for next 5 minutes

### Subsequent Calls (Reads Cache)

```
event: message_start
data: {
  "usage": {
    "input_tokens": 50,
    "cache_read_input_tokens": 5501
  }
}
```

**Meaning:**
- Read 50 new tokens
- Read 5501 cached tokens (90% discount!)
- Total effective: 50 + (5501 * 0.1) = 600.1 tokens

---

## Summary

### How Streaming Works

1. **Client sends:** Single HTTP POST with `stream: true`
2. **Server responds:** `Content-Type: text/event-stream`
3. **Events stream:** 7 event types in sequence
4. **Client assembles:** Concatenate deltas to build response
5. **Connection closes:** After `message_stop` event

### Key Insights

- **Always streaming:** 100% of Claude Code responses
- **Fine-grained:** Text streams 1-20 chars per delta
- **Tools stream too:** `input_json_delta` for tool parameters
- **Cache info included:** Usage stats in `message_start`
- **Stop reason determines action:** `tool_use` triggers execution loop

### For Proxy Implementers

**MUST:**
- ✅ Support SSE (text/event-stream)
- ✅ Forward all 7 event types
- ✅ Handle partial JSON in tool inputs
- ✅ Buffer partial lines correctly
- ✅ Send events immediately (don't batch)
- ✅ Include cache metrics

**Common Pitfalls:**
- ❌ Buffering whole response before sending
- ❌ Not handling partial UTF-8 characters
- ❌ Batching events (breaks UX)
- ❌ Missing ping events (causes timeouts)
- ❌ Wrong event sequence (breaks parsing)

---

**Last Updated:** 2025-11-11
**Based On:** Real traffic capture from monitor mode
**Status:** ✅ Complete with real examples
