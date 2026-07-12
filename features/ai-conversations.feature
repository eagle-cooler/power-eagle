Feature: AI conversations generate and refine plugins in versioned turns
  A conversation starts with an instruction that generates v1 and continues
  with follow-ups that refine the version currently selected — the model
  receives that version's real source. Every turn is recorded (failures too,
  with their error), a failed turn can be deleted, and conversations persist
  on disk across reloads.

  Scenario: A first message starts a conversation and generates v1
    Given a model that returns a valid plugin module
    When a turn runs with the instruction "make a todo list"
    Then a conversation exists with one ok turn at v1 whose module loads

  Scenario: A follow-up refines the selected version with its source in the prompt
    Given a conversation whose v1 was generated
    When a refining turn runs against v1 with the instruction "add a clear button"
    Then the model prompt contains v1's source and the conversation gains an ok v2

  Scenario: Refining an older version branches from that version's source
    Given a conversation with generated versions v1 and v2
    When a refining turn runs against v1
    Then the model prompt contains v1's source and not v2's

  Scenario: A turn whose module fails to load is recorded as failed
    Given a conversation whose v1 was generated
    When a refining turn runs and the produced module does not load
    Then the conversation records a failed v2 with the error and v1 still loads

  Scenario: A failed turn can be deleted from the conversation
    Given a conversation with an ok v1 and a failed v2
    When the failed turn is deleted
    Then the conversation has only the ok v1 turn

  Scenario: Conversations persist across reloads
    Given a conversation whose v1 was generated
    When conversations are listed fresh from disk
    Then the conversation is listed with its turn history
