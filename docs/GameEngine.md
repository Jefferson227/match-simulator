# Game Engine

The game engine is the mechanism responsible for managing the game state instead of React. And it was a suggestion from ChatGPT.

## How To Use It In Pages Or Components

In `src/context` there is a context called `GameEngineContext`. This context communicates with `game-engine.ts` and `game-state.ts` and both hold and manage the game state. That context is a wrapper and it's already being set as a provider along with the other context providers in the `src/providers/AppProviders.tsx`.

To use the game state, do as the example below:

```
import { useGameEngine } from "../contexts/GameEngineContext";
import { useGameState } from "../services/useGameState";

function Dashboard() {
  const engine = useGameEngine();
  const state = useGameState(engine);

  return (
    <button onClick={() => engine.dispatch({ type: "ADVANCE_WEEK" })}>
      Date: {state.currentDate}
    </button>
  );
}
```

## Adding New Actions

1. In the `game-state.ts` file, add the new action in the `GameAction` type.
2. Check if any change will needed to be made in the `GameState` type.
3. Then, in the `game-engine.ts` file, implement the new action in the `reduce` private method.
4. You're done! Your action is available to be called in any React component.
