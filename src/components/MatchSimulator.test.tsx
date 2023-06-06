import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import MatchSimulator from "./MatchSimulator";

let container: HTMLElement | null = null;

beforeEach(() => {
  // Set up a DOM element as a render target
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  // Clean up on exiting
  if (!container) return null;

  unmountComponentAtNode(container);
  container.remove();
  container = null;
});

it("renders the team names correctly", () => {
  act(() => {
    render(<MatchSimulator />, container);
  });

  const teamElements = container!.querySelectorAll(".team h2");
  expect(teamElements.length).toBe(2);
  expect(teamElements[0].textContent).toBe("Ceará");
  expect(teamElements[1].textContent).toBe("Fortaleza");
});

it("starts with a score of 0 for both teams", () => {
  act(() => {
    render(<MatchSimulator />, container);
  });

  const scoreElements = container!.querySelectorAll(".team p");
  expect(scoreElements.length).toBe(2);
  expect(scoreElements[0].textContent).toBe("0");
  expect(scoreElements[1].textContent).toBe("0");
});

it("increments the score for Ceará when a goal is scored at 15 minutes", () => {
  jest.useFakeTimers();
  act(() => {
    render(<MatchSimulator />, container);
  });

  act(() => {
    jest.advanceTimersByTime(15000);
  });

  const cearaScoreElement = container!.querySelector(".team:nth-child(1) p");
  expect(cearaScoreElement!.textContent).toBe("1");
});

it("increments the score for Fortaleza when a goal is scored at 30 minutes", () => {
  jest.useFakeTimers();
  act(() => {
    render(<MatchSimulator />, container);
  });

  act(() => {
    jest.advanceTimersByTime(30000);
  });

  const fortalezaScoreElement = container!.querySelector(
    ".team:nth-child(3) p"
  );
  expect(fortalezaScoreElement!.textContent).toBe("1");
});

it("stops the timer and clears the interval when the time reaches 90 minutes", () => {
  jest.useFakeTimers();
  act(() => {
    render(<MatchSimulator />, container);
  });

  act(() => {
    jest.advanceTimersByTime(90000);
  });

  const timeElement = container!.querySelector(".middle");
  expect(timeElement!.textContent).toBe("Time: 90");

  act(() => {
    jest.advanceTimersByTime(10000);
  });

  const newTimeElement = container!.querySelector(".middle");
  expect(newTimeElement!.textContent).toBe("Time: 90");
});

it("does not display the ScoreBoard component when there is no goal scorer", () => {
  act(() => {
    render(<MatchSimulator />, container);
  });

  const scoreboardElement = container!.querySelector(".scoreboard");
  expect(scoreboardElement).toBeNull();
});

it("renders the ScoreBoard component when there is a goal scorer", () => {
  jest.useFakeTimers();
  act(() => {
    render(<MatchSimulator />, container);
  });

  act(() => {
    jest.advanceTimersByTime(15000);
  });

  const scoreboardElement = container!.querySelector(".scoreboard");
  expect(scoreboardElement).not.toBeNull();
});
