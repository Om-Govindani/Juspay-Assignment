// Playground.jsx - Updated with fixed repeat block and concurrent sprite execution
import React, { useState, useEffect, useRef } from "react";

function Playground({ sprites, selectedSprite, spriteBlocks, isPlaying, onPlay }) {
  const playgroundRef = useRef(null);
  
  // State for sprite positions, rotations, messages, etc.
  const [spriteStates, setSpriteStates] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [draggedSprite, setDraggedSprite] = useState(null);
  
  // Get playground dimensions for centering
  const [playgroundDimensions, setPlaygroundDimensions] = useState({ width: 0, height: 0 });
  
  // Initialize sprite positions when sprites change
  useEffect(() => {
    if (playgroundRef.current) {
      const { clientWidth, clientHeight } = playgroundRef.current;
      setPlaygroundDimensions({ width: clientWidth, height: clientHeight });
      
      // Initialize positions for any new sprites
      sprites.forEach(sprite => {
        if (!spriteStates[sprite.id]) {
          setSpriteStates(prev => ({
            ...prev,
            [sprite.id]: {
              position: { 
                x: clientWidth / 2 - 30, // 30 is half the width of the sprite
                y: clientHeight / 2 - 30 // 30 is half the height of the sprite
              },
              rotation: 0,
              message: "",
              isVisible: true
            }
          }));
        }
      });
    }
  }, [sprites, playgroundRef]);

  // Handle sprite dragging - significantly improved
  const handleMouseDown = (e, sprite) => {
    if (isPlaying) return; // Prevent dragging during execution
    
    e.stopPropagation(); // Prevent event propagation
    setIsDragging(true);
    setDraggedSprite(sprite);
    
    // Store the initial mouse position
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    
    // Store the initial sprite position
    const initialSpritePos = { ...spriteStates[sprite.id].position };
    
    // Create mouse move handler for dragging
    const handleMouseMove = (moveEvent) => {
      // Calculate the delta from initial mouse position
      const deltaX = moveEvent.clientX - initialMouseX;
      const deltaY = moveEvent.clientY - initialMouseY;
      
      // Calculate new position
      let newX = initialSpritePos.x + deltaX;
      let newY = initialSpritePos.y + deltaY;
      
      // Ensure the sprite stays within the playground
      const playground = playgroundRef.current;
      if (playground) {
        const { clientWidth, clientHeight } = playground;
        newX = Math.max(0, Math.min(newX, clientWidth - 60));
        newY = Math.max(0, Math.min(newY, clientHeight - 60));
      }
      
      // Update the position for the specific sprite
      setSpriteStates(prev => ({
        ...prev,
        [sprite.id]: {
          ...prev[sprite.id],
          position: { x: newX, y: newY }
        }
      }));
    };
    
    // Create mouse up handler to stop dragging
    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggedSprite(null);
      
      // Remove event listeners when done dragging
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Convert screen coordinates to Scratch coordinate system (0,0 at center)
  const toScratchCoords = (screenX, screenY) => {
    const centerX = playgroundDimensions.width / 2;
    const centerY = playgroundDimensions.height / 2;
    return {
      x: Math.round(screenX - centerX),
      y: Math.round(-(screenY - centerY)) // Y is inverted in screen coordinates
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
  
  // Execute blocks when isPlaying changes
  useEffect(() => {
    if (!isPlaying) return;

    // Execute blocks for each sprite concurrently
    const executeSprites = async () => {
      // Create an array of promises to execute all sprites concurrently
      const spritePromises = sprites.map(sprite => {
        const blocks = spriteBlocks[sprite.id] || [];
        return executeBlocksForSprite(sprite, blocks);
      });
      
      // Wait for all sprites to finish their execution
      await Promise.all(spritePromises);
    };

    executeSprites();
  }, [isPlaying, sprites, spriteBlocks]);

  // Function to execute blocks for a specific sprite
  const executeBlocksForSprite = async (sprite, blocks) => {
    // Reset messages before execution
    setSpriteStates(prev => ({
      ...prev,
      [sprite.id]: {
        ...prev[sprite.id],
        message: ""
      }
    }));

    // Filter blocks with "When ▶️ clicked" as first block
    const eventBlock = blocks.find(block => block.category === "Event" && block.text.includes("When ▶️ clicked"));
    if (!eventBlock) return; // Don't execute if no event block
    
    // Process blocks in order, handling control flow properly
    await processBlocks(sprite, blocks, 0);
  };

  // Process blocks recursively, handling control flow properly
  const processBlocks = async (sprite, blocks, startIndex) => {
    for (let i = startIndex; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Skip the event block
      if (block.category === "Event" && block.text.includes("When ▶️ clicked")) {
        continue;
      }
      
      // Execute based on category
      if (block.category === "Motion") {
        await executeMotionBlock(sprite, block);
      } 
      else if (block.category === "Looks") {
        await executeLooksBlock(sprite, block);
      }
      else if (block.category === "Control") {
        if (block.text.includes("Repeat ___ times")) {
          const inputs = block.inputs || {};
          const times = parseInt(inputs[0] || "10", 10);
          
          // Find the blocks inside the repeat block
          // In a real implementation, blocks would have parent-child relationships
          // As a simplification, we'll take the next block after the repeat block
          const repeatBlockIndex = i;
          let nextBlockIndex = repeatBlockIndex + 1;
          
          // Execute the blocks inside the repeat block multiple times
          for (let j = 0; j < times; j++) {
            // Process the next block (and potentially its children)
            if (nextBlockIndex < blocks.length) {
              // Execute just the next block in the sequence for the repeat
              const nextBlock = blocks[nextBlockIndex];
              
              if (nextBlock.category === "Motion") {
                await executeMotionBlock(sprite, nextBlock);
              } 
              else if (nextBlock.category === "Looks") {
                await executeLooksBlock(sprite, nextBlock);
              }
            }
          }
          
          // Skip the next block since we already executed it
          i = nextBlockIndex;
        }
      }
    }
  };

  // Execute motion blocks
  const executeMotionBlock = async (sprite, block) => {
    const inputs = block.inputs || {};
    
    if (block.text.includes("Move ___ steps")) {
      // Get steps from input or default to 10
      const steps = parseFloat(inputs[0] || "10");
      
      // Update state using a function to ensure we have the most current state
      setSpriteStates(prev => {
        const currentState = prev[sprite.id];
        if (!currentState) return prev;
        
        const radians = currentState.rotation * Math.PI / 180;
        const currentPosition = currentState.position;
        
        // Calculate new position
        const newX = currentPosition.x + Math.cos(radians) * steps;
        const newY = currentPosition.y + Math.sin(radians) * steps; // Y is inverted in screen coordinates
        
        // Ensure the sprite stays within playground boundaries
        return {
          ...prev,
          [sprite.id]: {
            ...currentState,
            position: {
              x: Math.max(0, Math.min(newX, playgroundDimensions.width - 60)),
              y: Math.max(0, Math.min(newY, playgroundDimensions.height - 60))
            }
          }
        };
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    else if (block.text.includes("Turn ___ degree")) {
      // Get degree from input or default to 90
      const degrees = parseFloat(inputs[0] || "90");
      
      setSpriteStates(prev => {
        const currentState = prev[sprite.id];
        if (!currentState) return prev;
        
        return {
          ...prev,
          [sprite.id]: {
            ...currentState,
            rotation: currentState.rotation + degrees
          }
        };
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    else if (block.text.includes("Go to x:")) {
      // Get x,y coordinates from inputs or default to 0,0
      const scratchX = parseFloat(inputs[0] || "0");
      const scratchY = parseFloat(inputs[1] || "0");
      
      // Convert to screen coordinates (origin at center)
      const screenCoords = toScreenCoords(scratchX, scratchY);
      
      setSpriteStates(prev => {
        const currentState = prev[sprite.id];
        if (!currentState) return prev;
        
        return {
          ...prev,
          [sprite.id]: {
            ...currentState,
            position: {
              x: screenCoords.x - 30, // Adjust for sprite center
              y: screenCoords.y - 30  // Adjust for sprite center
            }
          }
        };
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  // Execute looks blocks
  const executeLooksBlock = async (sprite, block) => {
    const inputs = block.inputs || {};
    
    if (block.text.includes("Say ___")) {
      // Get message and duration
      let message = "Hello!";
      let duration = 2;
      
      if (block.text.includes("for ___ sec")) {
        message = inputs[0] || "Hello!";
        duration = parseFloat(inputs[1] || "2");
      }
      
      setSpriteStates(prev => ({
        ...prev,
        [sprite.id]: {
          ...prev[sprite.id],
          message: message
        }
      }));
      
      await new Promise(resolve => setTimeout(resolve, duration * 1000));
      
      setSpriteStates(prev => ({
        ...prev,
        [sprite.id]: {
          ...prev[sprite.id],
          message: ""
        }
      }));
    }
  };

  return (
    <div 
      ref={playgroundRef}
      className="h-full w-full bg-white border-2 border-gray-300 rounded-lg relative"
    >
      {/* Coordinate Display */}
      <div className="absolute top-2 left-2 text-xs bg-white/75 p-1 rounded">
        {selectedSprite && spriteStates[selectedSprite.id] && (
          <>
            Selected: {selectedSprite.name} | 
            x: {toScratchCoords(
              spriteStates[selectedSprite.id].position.x + 30, 
              spriteStates[selectedSprite.id].position.y + 30
            ).x}, 
            y: {toScratchCoords(
              spriteStates[selectedSprite.id].position.x + 30, 
              spriteStates[selectedSprite.id].position.y + 30
            ).y}
          </>
        )}
      </div>
      
      {/* Render all sprites */}
      {sprites.map(sprite => {
        const spriteState = spriteStates[sprite.id];
        if (!spriteState) return null;
        
        return (
          <div
            key={sprite.id}
            className="absolute cursor-grab active:cursor-grabbing"
            style={{
              left: `${spriteState.position.x}px`,
              top: `${spriteState.position.y}px`,
              transform: `rotate(${spriteState.rotation}deg)`,
              width: "70px",
              height: "70px",
              zIndex: 10,
              display: spriteState.isVisible ? 'block' : 'none',
              // Highlight selected sprite
              
              transition: isDragging && draggedSprite?.id === sprite.id ? 'none' : 'all 0.1s ease',
            }}
            onMouseDown={(e) => handleMouseDown(e, sprite)}
            onClick={() => selectedSprite?.id === sprite.id && onPlay()}
          >
            {/* Render sprite image */}
            <img 
              src={sprite.src} 
              alt={sprite.name}
              className="w-full h-full object-contain pointer-events-none"
              draggable="false"
            />

            {/* Speech bubble for messages */}
            {spriteState.message && (
              <div className="absolute top-0 right-0 transform translate-x-full -translate-y-full bg-white p-2 rounded-lg border border-gray-300 whitespace-nowrap z-20">
                {spriteState.message}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Playground;