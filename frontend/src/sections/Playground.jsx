import React, { useState, useEffect, useRef } from "react";
import CatSprite from "../components/Avatars/CatSprite";

function Playground({ droppedBlocks, isPlaying, onPlay }) {
  const playgroundRef = useRef(null);
  const [catPosition, setCatPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [message, setMessage] = useState("");
  const [rotation, setRotation] = useState(0);
  const [blockStates, setBlockStates] = useState({});

  // Get playground dimensions for centering
  const [playgroundDimensions, setPlaygroundDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    if (playgroundRef.current) {
      const { clientWidth, clientHeight } = playgroundRef.current;
      setPlaygroundDimensions({ width: clientWidth, height: clientHeight });
      // Set initial position to center of playground
      setCatPosition({ 
        x: clientWidth / 2 - 15, // 15 is half the width of the cat sprite
        y: clientHeight / 2 - 15 // 15 is half the height of the cat sprite
      });
    }
  }, []);

  // Handle cat dragging
  const handleMouseDown = (e) => {
    if (isPlaying) return; // Prevent dragging during execution
    setIsDragging(true);
    const rect = e.target.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const playground = playgroundRef.current;
    const rect = playground.getBoundingClientRect();
    
    // Calculate new position within the playground boundaries
    let newX = e.clientX - rect.left - dragOffset.x;
    let newY = e.clientY - rect.top - dragOffset.y;
    
    // Ensure the cat stays within the playground
    newX = Math.max(0, Math.min(newX, rect.width - 30));
    newY = Math.max(0, Math.min(newY, rect.height - 30));
    
    setCatPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset cat position if dragged outside
  useEffect(() => {
    const handleGlobalMouseUp = (e) => {
      if (!isDragging) return;
      
      const playground = playgroundRef.current;
      if (!playground) return;
      
      const rect = playground.getBoundingClientRect();
      
      // Check if mouse is outside playground
      if (
        e.clientX < rect.left || 
        e.clientX > rect.right || 
        e.clientY < rect.top || 
        e.clientY > rect.bottom
      ) {
        // Reset to center
        setCatPosition({ 
          x: playgroundDimensions.width / 2 - 15,
          y: playgroundDimensions.height / 2 - 15
        });
      }
      
      setIsDragging(false);
    };
    
    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDragging, playgroundDimensions]);

  // Convert screen coordinates to Scratch coordinate system (0,0 at center)
  const toScratchCoords = (screenX, screenY) => {
    const centerX = playgroundDimensions.width / 2;
    const centerY = playgroundDimensions.height / 2;
    return {
      x: screenX - centerX,
      y: -(screenY - centerY) // Y is inverted in screen coordinates
    };
  };

  // Convert Scratch coordinates to screen coordinates
  const toScreenCoords = (scratchX, scratchY) => {
    const centerX = playgroundDimensions.width / 2;
    const centerY = playgroundDimensions.height / 2;
    return {
      x: scratchX + centerX,
      y: centerY - scratchY // Y is inverted in screen coordinates
    };
  };
  
  useEffect(() => {
    if (!isPlaying) return;

    // Reset message and collect inputs before execution
    setMessage("");
    let executionStates = {};
    
    droppedBlocks.forEach(block => {
      // Get input values from the block
      const blockInputs = {};
      if (block.inputTypes && block.inputTypes.length > 0) {
        // Find the block element and get its inputs
        const blockElement = document.getElementById(block.id);
        if (blockElement) {
          const inputElements = blockElement.querySelectorAll('input');
          block.inputTypes.forEach((type, index) => {
            const input = inputElements[index];
            blockInputs[index] = input ? input.value || "0" : "0";
          });
        }
      }
      executionStates[block.id] = blockInputs;
    });
    
    setBlockStates(executionStates);

    const executeBlocks = async () => {
      for (const block of droppedBlocks) {
        const blockInputs = blockStates[block.id] || {};
        
        if (block.category === "Motion") {
          if (block.text.includes("Move ___ steps")) {
            // Get steps from input or default to 10
            const steps = parseFloat(blockInputs[0] || "10");
            
            // Move in the direction of rotation
            const radians = rotation * Math.PI / 180;
            setCatPosition(prev => {
              // Calculate new position
              const newX = prev.x + Math.cos(radians) * steps;
              const newY = prev.y - Math.sin(radians) * steps; // Y is inverted in screen coordinates
              
              // Ensure the cat stays within playground boundaries
              return {
                x: Math.max(0, Math.min(newX, playgroundDimensions.width - 30)),
                y: Math.max(0, Math.min(newY, playgroundDimensions.height - 30))
              };
            });
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          else if (block.text.includes("Turn ___ degree")) {
            // Get degree from input or default to 90
            const degrees = parseFloat(blockInputs[0] || "90");
            setRotation(prev => prev + degrees);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          else if (block.text.includes("Go to x:")) {
            // Get x,y coordinates from inputs or default to 0,0
            const scratchX = parseFloat(blockInputs[0] || "0");
            const scratchY = parseFloat(blockInputs[1] || "0");
            
            // Convert to screen coordinates (origin at center)
            const screenCoords = toScreenCoords(scratchX, scratchY);
            
            setCatPosition({
              x: screenCoords.x - 15, // Adjust for sprite center
              y: screenCoords.y - 15  // Adjust for sprite center
            });
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        else if (block.category === "Looks") {
          if (block.text.includes("Say ___")) {
            // Get message and duration
            let message = "Hello!";
            let duration = 2;
            
            if (block.text.includes("for ___ sec")) {
              message = blockInputs[0] || "Hello!";
              duration = parseFloat(blockInputs[1] || "2");
            }
            
            setMessage(message);
            await new Promise(resolve => setTimeout(resolve, duration * 1000));
            setMessage("");
          }
        }
        else if (block.category === "Control") {
          if (block.text.includes("Repeat ___ times")) {
            const times = parseInt(blockInputs[0] || "10", 10);
            
            // Find index of this block and next block
            const blockIndex = droppedBlocks.findIndex(b => b.id === block.id);
            const nextBlock = droppedBlocks[blockIndex + 1];
            
            if (nextBlock) {
              for (let i = 0; i < times; i++) {
                // Execute only the next block repeatedly
                // Execute according to its category (simplified for demo)
                if (nextBlock.category === "Motion") {
                  if (nextBlock.text.includes("Move ___ steps")) {
                    const nextBlockInputs = blockStates[nextBlock.id] || {};
                    const steps = parseFloat(nextBlockInputs[0] || "10");
                    const radians = rotation * Math.PI / 180;
                    setCatPosition(prev => {
                      const newX = prev.x + Math.cos(radians) * steps;
                      const newY = prev.y - Math.sin(radians) * steps;
                      return {
                        x: Math.max(0, Math.min(newX, playgroundDimensions.width - 30)),
                        y: Math.max(0, Math.min(newY, playgroundDimensions.height - 30))
                      };
                    });
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                  else if (nextBlock.text.includes("Turn ___ degree")) {
                    const nextBlockInputs = blockStates[nextBlock.id] || {};
                    const degrees = parseFloat(nextBlockInputs[0] || "90");
                    setRotation(prev => prev + degrees);
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                }
              }
            }
          }
        }
      }
    };

    executeBlocks();
  }, [isPlaying, droppedBlocks, rotation, playgroundDimensions, blockStates]);

  // Convert current position to Scratch coordinates for display
  const scratchPosition = toScratchCoords(catPosition.x + 15, catPosition.y + 15);

  return (
    <div 
      ref={playgroundRef}
      className="h-full w-full bg-white border-2 border-gray-300 rounded-lg relative"
      onMouseMove={handleMouseMove}
    >
      {/* Add coordinate display for debugging */}
      <div className="absolute top-2 left-2 text-xs bg-white/75 p-1 rounded">
        x: {Math.round(scratchPosition.x)}, y: {Math.round(scratchPosition.y)}
      </div>
      
      <div
        className="absolute cursor-grab active:cursor-grabbing"
        style={{
          left: `${catPosition.x}px`,
          top: `${catPosition.y}px`,
          transform: `rotate(${rotation}deg)`,
          width: "30px",
          height: "30px",
          zIndex: 10
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={onPlay}
      >
        <CatSprite />

        {message && (
          <div className="absolute top-0 right-0 transform translate-x-full -translate-y-full bg-white p-2 rounded-lg border border-gray-300 whitespace-nowrap z-20">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default Playground;