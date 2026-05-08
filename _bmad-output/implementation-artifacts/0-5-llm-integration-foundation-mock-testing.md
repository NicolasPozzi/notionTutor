# Story 0.5: LLM Integration Foundation with Mock Testing

Status: ready-for-dev

## Story

As a **developer**,
I want **an OpenAI adapter with mock support for tests**,
so that **I can develop and test AI features without API costs or rate limits**.

## Acceptance Criteria

### AC1: Mock Mode
- **Given** `MOCK_LLM=true` in environment
- **When** code calls the LLM adapter
- **Then** mock responses are returned (deterministic test data)

### AC2: Real OpenAI Mode
- **Given** `MOCK_LLM=false` or not set
- **When** code calls the LLM adapter with page content
- **Then** real OpenAI GPT-4o-mini calls generate questions
- **And** response follows `[{"question": "...", "answerExcerpt": "..."}]` format

### AC3: Interface Pattern
- **Given** the adapter architecture
- **When** the adapter is imported
- **Then** it follows the `QuestionGenerator` interface pattern (ARCH-9)
- **And** switching provider requires no consumer code changes

### AC4: Error Handling
- **Given** the LLM adapter
- **When** OpenAI returns errors, timeouts, or rate limits
- **Then** errors are handled gracefully with typed error responses
- **And** circuit breaker opens after 5 consecutive failures (ARCH-10)
- **And** circuit resets after 60 seconds

## Tasks / Subtasks

- [ ] **Task 1: Define QuestionGenerator interface** (AC: #3)
  - [ ] Create types for GenerateQuestionsInput, GeneratedQuestion, GenerateQuestionsResult
  - [ ] Define QuestionGenerator interface with generateQuestions method

- [ ] **Task 2: Create OpenAI adapter** (AC: #2, #4)
  - [ ] Install openai SDK
  - [ ] Implement OpenAIQuestionGenerator class
  - [ ] System prompt from architecture spec
  - [ ] Model: gpt-4o-mini, timeout: 30s, max_tokens: 1000
  - [ ] Parse JSON response, validate structure
  - [ ] Handle API errors (rate limit, timeout, invalid response)

- [ ] **Task 3: Create mock adapter** (AC: #1)
  - [ ] Implement MockQuestionGenerator class
  - [ ] Return deterministic questions based on input
  - [ ] Simulate realistic delay (500ms)

- [ ] **Task 4: Create circuit breaker** (AC: #4)
  - [ ] Implement generic circuit breaker utility
  - [ ] 5 failures → open, reset after 60s
  - [ ] Wrap OpenAI adapter with circuit breaker

- [ ] **Task 5: Create adapter factory** (AC: #1, #2, #3)
  - [ ] Factory reads MOCK_LLM env var
  - [ ] Returns MockQuestionGenerator or OpenAIQuestionGenerator
  - [ ] Export from src/lib/adapters/llm/index.ts

- [ ] **Task 6: Update .env.example** (AC: #2)
  - [ ] Verify OPENAI_API_KEY and MOCK_LLM documented

## Dev Notes

### Architecture Requirements
- **ARCH-4**: LLM = OpenAI GPT-4o-mini
- **ARCH-9**: Adapter pattern pour Notion API et LLM (abstraction)
- **ARCH-10**: Circuit breaker sur toutes les intégrations externes
- **NFR2**: Génération 1ère question IA < 3 secondes
- **NFR15**: Abstraction LLM pour changement de provider sans refonte majeure

### System Prompt (from Architecture Spec)
```
Tu es un tuteur expert. À partir du contenu suivant, génère {count} questions
de révision pertinentes et variées. Les questions doivent :
- Tester la compréhension, pas juste la mémorisation
- Être formulées clairement
- Avoir des réponses trouvables dans le contenu

Format JSON: [{"question": "...", "answerExcerpt": "..."}]
```

### OpenAI Config
- Model: `gpt-4o-mini`
- Timeout: 30 seconds
- Max tokens: 1000 (response)
- Cost: ~$0.0005/session (5 questions)

### Circuit Breaker Config
- Threshold: 5 consecutive failures
- Reset timeout: 60 seconds
- States: closed → open → half-open → closed

### File Structure
```
src/lib/adapters/llm/
├── index.ts              ← Factory + re-exports
├── types.ts              ← QuestionGenerator interface
├── openai-adapter.ts     ← Real OpenAI implementation
├── mock-adapter.ts       ← Mock for dev/test
└── circuit-breaker.ts    ← Generic circuit breaker
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Intégration OpenAI]
- [Source: _bmad-output/planning-artifacts/architecture.md#Circuit Breaker]
- [Source: _bmad-output/planning-artifacts/prd.md#FR17, NFR2, NFR15]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 0, Story 0.5]

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
