// App.jsx - Updated to track multiple sprites and their blocks
import { useState } from "react";
import Navbar from "./components/Navbar";
import MidArea from "./sections/MidArea";
import Playground from "./sections/Playground";
import Sidebar from "./sections/Sidebar";
import SpriteControl from "./sections/SpriteControl";
import { DragDropContext } from "react-beautiful-dnd";
import CatSprite from "./assets/cat.svg";
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
  // Initial cat sprite
  const initialSprite = { id: 1, name: "Cat", src: CatSprite };
  
  // State for sprites
  const [sprites, setSprites] = useState([initialSprite]);
  const [selectedSprite, setSelectedSprite] = useState(initialSprite);
  
  // State for blocks - now an object keyed by sprite ID
  const [spriteBlocks, setSpriteBlocks] = useState({
    [initialSprite.id]: [] // Initial empty blocks for first sprite
  });
  
  const [isPlaying, setIsPlaying] = useState(false);

  const handleAddSprite = (sprite) => {
    setSprites(prev => [...prev, sprite]);
    // Initialize empty blocks for new sprite
    setSpriteBlocks(prev => ({
      ...prev,
      [sprite.id]: []
    }));
  };

  const handleSelectSprite = (sprite) => {
    setSelectedSprite(sprite);
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    
    // If dragging from sidebar to midarea, copy the block
    if (source.droppableId === "sidebar" && destination.droppableId === "midarea") {
      // draggableId is in format: "sidebar-<categoryName>-<blockIndex>"
      const parts = draggableId.split("-");
      const categoryName = parts[1];
      const blockIndex = parseInt(parts[2], 10);
      
      // Find the block from categories list
      const category = categories.find((c) => c.name === categoryName);
      if (!category) return;
      const block = category.content[blockIndex];
      
      // Create a new block copy with a unique id
      const newBlock = { 
        id: `block-${Date.now()}`, 
        text: block.text, 
        inputTypes: block.inputTypes, 
        color: category.color,
        category: categoryName,
        inputs: {} // Initialize empty inputs object
      };
      
      // Get current blocks for the selected sprite
      const currentBlocks = spriteBlocks[selectedSprite.id] || [];
      
      // If it's an Event block, move it to the top of the stack
      if (categoryName === "Event") {
        const newBlocks = Array.from(currentBlocks);
        newBlocks.unshift(newBlock); // Add to beginning
        setSpriteBlocks({
          ...spriteBlocks,
          [selectedSprite.id]: newBlocks
        });
      } else {
        // Insert newBlock into blocks at the destination index
        const newBlocks = Array.from(currentBlocks);
        newBlocks.splice(destination.index, 0, newBlock);
        setSpriteBlocks({
          ...spriteBlocks,
          [selectedSprite.id]: newBlocks
        });
      }
    }
    // If reordering within midarea, update the list accordingly
    else if (source.droppableId === "midarea" && destination.droppableId === "midarea") {
      const currentBlocks = spriteBlocks[selectedSprite.id] || [];
      const newBlocks = Array.from(currentBlocks);
      const [removed] = newBlocks.splice(source.index, 1);
      
      // If it's an Event block being moved, ensure it stays at the top
      if (removed.category === "Event") {
        newBlocks.unshift(removed);
      } else {
        newBlocks.splice(destination.index, 0, removed);
      }
      
      setSpriteBlocks({
        ...spriteBlocks,
        [selectedSprite.id]: newBlocks
      });
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    // Reset after execution completes (simulated with timeout)
    setTimeout(() => setIsPlaying(false), 2000);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="bg-white w-full h-screen py-2 px-5 items-center flex flex-col">
        <Navbar onPlay={handlePlay} />
        <div className="flex flex-row items-center h-full w-full gap-1 mt-2">
          <Sidebar categories={categories} />
          <MidArea 
            droppedBlocks={spriteBlocks[selectedSprite.id] || []} 
            setDroppedBlocks={(blocks) => {
              setSpriteBlocks({
                ...spriteBlocks,
                [selectedSprite.id]: blocks
              });
            }} 
            selectedSprite={selectedSprite}
          />
          <div className="flex flex-col items-center h-full w-full gap-1">
            <Playground 
              sprites={sprites}
              selectedSprite={selectedSprite}
              spriteBlocks={spriteBlocks} 
              isPlaying={isPlaying} 
              onPlay={handlePlay} 
            />
            <SpriteControl 
              sprites={sprites}
              selectedSprite={selectedSprite}
              onSpriteAdd={handleAddSprite} 
              onSpriteSelect={handleSelectSprite} 
            />
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}

export default App;