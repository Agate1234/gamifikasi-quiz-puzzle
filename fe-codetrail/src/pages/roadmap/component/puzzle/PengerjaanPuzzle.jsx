import React from "react";
import DragDropPuzzle from "./DragDropPuzzle";
import FillBlankPuzzle from "./FillBlankPuzzle";
import CodePuzzle from "./CodePuzzle";

export default function PuzzleFullscreen({
  open,
  puzzle,
  type,
  puzzleTitle = "Puzzle",
  moduleLabel = "03",
  moduleName = "Modul",
  xpPotential = 0,
  secondsTotal = 5 * 60,
  onClose,
  onFinish,
}) {
  if (!open) return null;

  const puzzleType = type || puzzle?.tipe_puzzle || puzzle?.type || "drag_drop";

  const commonProps = {
    open,
    puzzle,
    puzzleTitle: puzzle?.judul_puzzle || puzzle?.title || puzzleTitle,
    moduleLabel,
    moduleName,
    xpPotential: Number(puzzle?.exp_puzzle || puzzle?.xp || xpPotential || 0),
    secondsTotal: Number(puzzle?.waktu || secondsTotal || 300),
    onClose,
    onFinish,
  };

  if (puzzleType === "fill_blank") {
    return <FillBlankPuzzle {...commonProps} />;
  }

  if (puzzleType === "code") {
    return <CodePuzzle {...commonProps} />;
  }

  return <DragDropPuzzle {...commonProps} />;
}
