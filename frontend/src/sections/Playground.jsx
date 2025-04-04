// Playground.jsx - Updated collision handling with cooldown and updated block processing
import React, { useState, useEffect, useRef } from "react";

function Playground({ sprites, selectedSprite, spriteBlocks, isPlaying, onPlay, setSpriteBlocks }) {
  const playgroundRef = useRef(null);
  
  // Sprite states and dimensions
  const [spriteStates, setSpriteStates] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [draggedSprite, setDraggedSprite] = useState(null);
  const [playgroundDimensions, setPlaygroundDimensions] = useState({ width: 0, height: 0 });
  
  // Ref to store latest spriteBlocks for block processing
  const blocksRef = useRef(spriteBlocks);
  useEffect(() => {
    blocksRef.current = spriteBlocks;
  }, [spriteBlocks]);
  
  // Collision cooldown: store last collision time for a pair as "spriteA-spriteB"
  const collisionCooldownRef = useRef({});
  const COLLISION_COOLDOWN = 500; // in milliseconds
  
  // Flag to avoid overlapping collision updates
  const isUpdatingCollision = useRef(false);
  // Collision check interval ref
  const collisionIntervalId = useRef(null);
  
  // Initialize sprite positions
  useEffect(() => {
    if (playgroundRef.current) {
      const { clientWidth, clientHeight } = playgroundRef.current;
      setPlaygroundDimensions({ width: clientWidth, height: clientHeight });
      
      sprites.forEach(sprite => {
        if (!spriteStates[sprite.id]) {
          setSpriteStates(prev => ({
            ...prev,
            [sprite.id]: {
              position: { x: clientWidth / 2 - 30, y: clientHeight / 2 - 30 },
              rotation: 0,
              message: "",
              isVisible: true,
              step: 10,
            }
          }));
        }
      });
    }
  }, [sprites, playgroundRef]);
  
  // Handle dragging (unchanged)
  const handleMouseDown = (e, sprite) => {
    if (isPlaying) return;
    e.stopPropagation();
    setIsDragging(true);
    setDraggedSprite(sprite);
    
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    const initialSpritePos = { ...spriteStates[sprite.id].position };
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - initialMouseX;
      const deltaY = moveEvent.clientY - initialMouseY;
      let newX = initialSpritePos.x + deltaX;
      let newY = initialSpritePos.y + deltaY;
      
      const playground = playgroundRef.current;
      if (playground) {
        const { clientWidth, clientHeight } = playground;
        newX = Math.max(0, Math.min(newX, clientWidth - 60));
        newY = Math.max(0, Math.min(newY, clientHeight - 60));
      }
      
      setSpriteStates(prev => ({
        ...prev,
        [sprite.id]: {
          ...prev[sprite.id],
          position: { x: newX, y: newY }
        }
      }));
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggedSprite(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Coordinate conversion functions
  const toScratchCoords = (screenX, screenY) => {
    const centerX = playgroundDimensions.width / 2;
    const centerY = playgroundDimensions.height / 2;
    return { x: Math.round(screenX - centerX), y: Math.round(-(screenY - centerY)) };
  };
  
  const toScreenCoords = (scratchX, scratchY) => {
    const centerX = playgroundDimensions.width / 2;
    const centerY = playgroundDimensions.height / 2;
    return { x: scratchX + centerX, y: centerY - scratchY };
  };
  
  useEffect(() => {
    if (!playgroundRef.current) return;
    const { clientWidth, clientHeight } = playgroundRef.current;
    setPlaygroundDimensions({ width: clientWidth, height: clientHeight });
    setSpriteStates(prev => {
      const newState = { ...prev };
      sprites.forEach(sprite => {
        if (!newState[sprite.id]) {
          newState[sprite.id] = {
            position: { x: clientWidth / 2 - 30, y: clientHeight / 2 - 30 },
            rotation: 0,
            message: "",
            isVisible: true,
            step: 10,
          };
        }
      });
      return newState;
    });
  }, [sprites, playgroundRef.current]);
  
  // Set up continuous collision checking only during execution
  useEffect(() => {
    if (isPlaying) {
      collisionIntervalId.current = setInterval(checkCollisionAndSwapSteps, 50);
    } else {
      if (collisionIntervalId.current) {
        clearInterval(collisionIntervalId.current);
        collisionIntervalId.current = null;
      }
      // Clear collision cooldown when not playing
      collisionCooldownRef.current = {};
    }
    return () => {
      if (collisionIntervalId.current) {
        clearInterval(collisionIntervalId.current);
        collisionIntervalId.current = null;
      }
    };
  }, [isPlaying, spriteStates]);
  
  // Collision checking and updating spriteBlocks state.
  const checkCollisionAndSwapSteps = () => {
    if (isUpdatingCollision.current) return;
    isUpdatingCollision.current = true;
    
    setSpriteBlocks(prevBlocks => {
      let newBlocks = { ...prevBlocks };
      let collisionOccurred = false;
      const now = Date.now();
      
      sprites.forEach(spriteA => {
        sprites.forEach(spriteB => {
          if (spriteA.id === spriteB.id) return;
          // Create a key for this pair in a sorted order to avoid duplicates
          const pairKey = [spriteA.id, spriteB.id].sort().join("-");
          
          // If collision for this pair was handled recently, skip
          if (collisionCooldownRef.current[pairKey] && (now - collisionCooldownRef.current[pairKey] < COLLISION_COOLDOWN)) {
            return;
          }
          
          const posA = spriteStates[spriteA.id]?.position;
          const posB = spriteStates[spriteB.id]?.position;
          if (posA && posB) {
            const distance = Math.hypot(posA.x - posB.x, posA.y - posB.y);
            if (distance <= 60) {
              // Get the motion blocks for each sprite
              const blocksA = newBlocks[spriteA.id] || [];
              const blocksB = newBlocks[spriteB.id] || [];
              const moveIndexA = blocksA.findIndex(b => b.category === "Motion" && b.text.includes("Move"));
              const moveIndexB = blocksB.findIndex(b => b.category === "Motion" && b.text.includes("Move"));
              
              const stepA = moveIndexA >= 0 ? parseFloat(blocksA[moveIndexA].inputs[0] || "10") : 0;
              const stepB = moveIndexB >= 0 ? parseFloat(blocksB[moveIndexB].inputs[0] || "10") : 0;
              
              if (moveIndexA >= 0 && moveIndexB >= 0) {
                // Both sprites are moving: swap the steps if they differ.
                if (stepA !== stepB) {
                  newBlocks[spriteA.id][moveIndexA].inputs[0] = String(stepB);
                  newBlocks[spriteB.id][moveIndexB].inputs[0] = String(stepA);
                  collisionOccurred = true;
                  // Mark this pair in cooldown.
                  collisionCooldownRef.current[pairKey] = now;
                  console.log(`Collision: Swapping steps between ${spriteA.name} and ${spriteB.name}`);
                }
              } else if (moveIndexA >= 0 && moveIndexB < 0) {
                // Sprite A is moving, Sprite B is stationary: transfer movement from A to B.
                if (stepA !== 0) {
                  newBlocks[spriteA.id][moveIndexA].inputs[0] = "0";
                  newBlocks[spriteB.id] = newBlocks[spriteB.id] || [];
                  newBlocks[spriteB.id].push({
                    id: `block-${Date.now()}`,
                    text: "Move ___ steps",
                    inputTypes: ["number"],
                    color: "bg-blue-400",
                    category: "Motion",
                    inputs: { 0: String(stepA) }
                  });
                  collisionOccurred = true;
                  collisionCooldownRef.current[pairKey] = now;
                  console.log(`Collision: Transferring steps from ${spriteA.name} to ${spriteB.name}`);
                }
              } else if (moveIndexA < 0 && moveIndexB >= 0) {
                // Sprite B is moving, Sprite A is stationary: transfer movement from B to A.
                if (stepB !== 0) {
                  newBlocks[spriteB.id][moveIndexB].inputs[0] = "0";
                  newBlocks[spriteA.id] = newBlocks[spriteA.id] || [];
                  newBlocks[spriteA.id].push({
                    id: `block-${Date.now()}`,
                    text: "Move ___ steps",
                    inputTypes: ["number"],
                    color: "bg-blue-400",
                    category: "Motion",
                    inputs: { 0: String(stepB) }
                  });
                  collisionOccurred = true;
                  collisionCooldownRef.current[pairKey] = now;
                  console.log(`Collision: Transferring steps from ${spriteB.name} to ${spriteA.name}`);
                }
              }
            }
          }
        });
      });
      
      isUpdatingCollision.current = false;
      return collisionOccurred ? newBlocks : prevBlocks;
    });
  };
  
  // Execute sprite blocks concurrently
  useEffect(() => {
    if (!isPlaying) return;
    const executeSprites = async () => {
      await Promise.all(sprites.map(sprite => executeBlocksForSprite(sprite)));
    };
    executeSprites();
  }, [isPlaying]);
  
  // Execute blocks for a sprite using the updated blocksRef
  const executeBlocksForSprite = async (sprite) => {
    setSpriteStates(prev => ({
      ...prev,
      [sprite.id]: { ...prev[sprite.id], message: "" }
    }));
    const currentBlocks = blocksRef.current[sprite.id] || [];
    const eventBlock = currentBlocks.find(b => b.category === "Event" && b.text.includes("When ▶️ clicked"));
    if (!eventBlock) return;
    await processBlocks(sprite, 0);
  };
  
  // Process blocks sequentially, always reading the latest blocks from blocksRef
  const processBlocks = async (sprite, startIndex) => {
    let currentIndex = startIndex;
    while (true) {
      const currentBlocks = blocksRef.current[sprite.id] || [];
      if (currentIndex >= currentBlocks.length) break;
      const block = currentBlocks[currentIndex];
      if (block.category === "Event" && block.text.includes("When ▶️ clicked")) {
        currentIndex++;
        continue;
      }
      if (block.category === "Motion") {
        await executeMotionBlock(sprite, block);
      } else if (block.category === "Looks") {
        await executeLooksBlock(sprite, block);
      } else if (block.category === "Control" && block.text.includes("Repeat ___ times")) {
        const times = parseInt(block.inputs[0] || "10", 10);
        currentIndex++;
        for (let j = 0; j < times; j++) {
          await processBlocks(sprite, currentIndex);
        }
        continue;
      }
      currentIndex++;
    }
  };
  
  // Execute motion blocks
  const executeMotionBlock = async (sprite, block) => {
    const inputs = block.inputs || {};
    if (block.text.includes("Move ___ steps")) {
      const steps = parseFloat(inputs[0] || "10");
      setSpriteStates(prev => {
        const currentState = prev[sprite.id];
        if (!currentState) return prev;
        const radians = currentState.rotation * Math.PI / 180;
        const currentPosition = currentState.position;
        const newX = currentPosition.x + Math.cos(radians) * steps;
        const newY = currentPosition.y + Math.sin(radians) * steps;
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
    } else if (block.text.includes("Turn ___ degree")) {
      const degrees = parseFloat(inputs[0] || "90");
      setSpriteStates(prev => {
        const currentState = prev[sprite.id];
        if (!currentState) return prev;
        return {
          ...prev,
          [sprite.id]: { ...currentState, rotation: currentState.rotation + degrees }
        };
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    } else if (block.text.includes("Go to x:")) {
      const scratchX = parseFloat(inputs[0] || "0");
      const scratchY = parseFloat(inputs[1] || "0");
      const screenCoords = toScreenCoords(scratchX, scratchY);
      setSpriteStates(prev => {
        const currentState = prev[sprite.id];
        if (!currentState) return prev;
        return {
          ...prev,
          [sprite.id]: {
            ...currentState,
            position: { x: screenCoords.x - 30, y: screenCoords.y - 30 }
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
      let message = "Hello!";
      let duration = 2;
      if (block.text.includes("for ___ sec")) {
        message = inputs[0] || "Hello!";
        duration = parseFloat(inputs[1] || "2");
      }
      setSpriteStates(prev => ({
        ...prev,
        [sprite.id]: { ...prev[sprite.id], message }
      }));
      await new Promise(resolve => setTimeout(resolve, duration * 1000));
      setSpriteStates(prev => ({
        ...prev,
        [sprite.id]: { ...prev[sprite.id], message: "" }
      }));
    }
  };
  
  return (
    <div ref={playgroundRef} className="h-full w-full bg-white border-2 border-gray-300 rounded-lg relative">
      <div className="absolute top-2 left-2 text-xs bg-white/75 p-1 rounded">
        {selectedSprite && spriteStates[selectedSprite.id] && (
          <>
            Selected: {selectedSprite.name} | x: {toScratchCoords(
              spriteStates[selectedSprite.id].position.x + 30, 
              spriteStates[selectedSprite.id].position.y + 30
            ).x}, y: {toScratchCoords(
              spriteStates[selectedSprite.id].position.x + 30, 
              spriteStates[selectedSprite.id].position.y + 30
            ).y}
          </>
        )}
      </div>
      
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
              transition: isDragging && draggedSprite?.id === sprite.id ? 'none' : 'all 0.1s ease'
            }}
            onMouseDown={(e) => handleMouseDown(e, sprite)}
            onClick={() => selectedSprite?.id === sprite.id && onPlay()}
          >
            <img src={sprite.src} alt={sprite.name} className="w-full h-full object-contain pointer-events-none" draggable="false" />
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
