import { useState } from "react";
import Navbar from "./components/Navbar";
import MidArea from "./sections/MidArea";
import Playground from "./sections/Playground";
import Sidebar from "./sections/Sidebar";
import SpriteControl from "./sections/SpriteControl";
import { DragDropContext } from "react-beautiful-dnd";

// Moved categories list so that both Sidebar and App can use it.
export const categories = [
  { 
    name: "Motion", 
    color: "bg-blue-400", 
    content: [
      { text: "Move ___ steps", inputTypes: ["number"] },
      { text: "Turn ___ degree", inputTypes: ["number"] },
      { text: "Go to x: ___ y: ___", inputTypes: ["number", "number"] }
    ]
  },
  { 
    name: "Looks", 
    color: "bg-purple-400", 
    content: [
      { text: "Say ___ for ___ sec", inputTypes: ["text", "number"] },
      { text: "Say Hello", inputTypes: [] }
    ]
  },
  { 
    name: "Event", 
    color: "bg-yellow-400", 
    content: [
      { text: "When ▶️ clicked", inputTypes: [] }
    ]
  },
  { 
    name: "Control", 
    color: "bg-green-400", 
    content: [
      { text: "Repeat ___ times", inputTypes: ["number"] }
    ]
  },
];

function App() {
  const [droppedBlocks, setDroppedBlocks] = useState([]);

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    console.log(hello)
    // If dragging from sidebar to midarea, copy the block
    if (source.droppableId === "sidebar" && destination.droppableId === "midarea") {
      // draggableId is in format: "sidebar-<categoryName>-<blockIndex>"
      console.log(draggableId)
      const parts = draggableId.split("-");
      const categoryName = parts[1];
      const blockIndex = parseInt(parts[2], 10);
      
      // Find the block from categories list
      const category = categories.find((c) => c.name === categoryName);
      if (!category) return;
      const block = category.content[blockIndex];
      
      // Create a new block copy with a unique id (using Date.now() for simplicity)
      const newBlock = { 
        id: `block-${Date.now()}`, 
        text: block.text, 
        inputTypes: block.inputTypes, 
        color: category.color,
        category: categoryName
      };
      
      // Insert newBlock into droppedBlocks at the destination index
      const newDroppedBlocks = Array.from(droppedBlocks);
      newDroppedBlocks.splice(destination.index, 0, newBlock);
      setDroppedBlocks(newDroppedBlocks);
    }
    // If reordering within midarea, update the list accordingly
    else if (source.droppableId === "midarea" && destination.droppableId === "midarea") {
      const newDroppedBlocks = Array.from(droppedBlocks);
      const [removed] = newDroppedBlocks.splice(source.index, 1);
      newDroppedBlocks.splice(destination.index, 0, removed);
      setDroppedBlocks(newDroppedBlocks);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="bg-white w-full h-screen py-2 px-5 items-center flex flex-col">
        <Navbar />
        <div className="flex flex-row items-center h-full w-full gap-1 mt-2">
          <Sidebar categories={categories} />
          <MidArea droppedBlocks={droppedBlocks} setDroppedBlocks={setDroppedBlocks} />
          <div className="flex flex-col items-center h-full w-full gap-1">
            <Playground />
            <SpriteControl />
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}

export default App;
