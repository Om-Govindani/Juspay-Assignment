import { Droppable, Draggable } from "react-beautiful-dnd";
import { useState } from "react";

function DroppedBlock({ block, updateBlockInputs, onDelete }) {
  // Local state for input values in the dropped block
  const [inputs, setInputs] = useState({});
  const [isHovered, setIsHovered] = useState(false);

  const handleInputChange = (inputIndex, value, inputType) => {
    if (inputType === "number") {
      value = value.replace(/[^0-9.-]/g, "");
      const decimalCount = (value.match(/\./g) || []).length;
      if (decimalCount > 1) {
        const parts = value.split(".");
        value = parts[0] + "." + parts.slice(1).join("");
      }
    }
    const newInputs = { ...inputs, [inputIndex]: value };
    setInputs(newInputs);
    updateBlockInputs(block.id, newInputs);
  };

  const parts = block.text.split("___");
  const inputTypes = block.inputTypes || [];

  return (
    <div 
      id={block.id}
      className={`${block.color} p-2 text-xl w-full rounded-lg text-center flex items-center justify-center gap-2 mb-2 relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Delete button that appears on hover */}
      {isHovered && (
        <button 
          className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(block.id);
          }}
        >
          ✕
        </button>
      )}
      
      {parts.map((part, inputIndex) => {
        const showInput = inputIndex < parts.length - 1;
        const inputType = inputTypes[inputIndex] || "text";
        return (
          <span key={inputIndex} className="flex items-center gap-2">
            {part.trim()}
            {showInput && (
              <input
                type={inputType === "number" ? "text" : "text"}
                className="w-20 px-2 py-1 text-black rounded-md outline-none border border-gray-800"
                value={inputs[inputIndex] || ""}
                onChange={(e) => handleInputChange(inputIndex, e.target.value, inputType)}
                placeholder={inputType === "number" ? "0" : "text"}
                data-input-index={inputIndex}
                data-input-type={inputType}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

function MidArea({ droppedBlocks, setDroppedBlocks }) {
  const [blockInputs, setBlockInputs] = useState({});

  const updateBlockInputs = (blockId, inputs) => {
    setBlockInputs(prev => ({
      ...prev,
      [blockId]: inputs
    }));
    
    // Update the droppedBlocks with the current input values
    const updatedBlocks = droppedBlocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          inputs: inputs
        };
      }
      return block;
    });
    
    setDroppedBlocks(updatedBlocks);
  };

  const handleDeleteBlock = (blockId) => {
    // Remove the block with the matching ID
    const updatedBlocks = droppedBlocks.filter(block => block.id !== blockId);
    setDroppedBlocks(updatedBlocks);
    
    // Also clean up any stored inputs for this block
    const updatedInputs = { ...blockInputs };
    delete updatedInputs[blockId];
    setBlockInputs(updatedInputs);
  };

  return (
    <div className="h-full w-full bg-slate-300 rounded-lg p-4 overflow-auto">
      <Droppable droppableId="midarea" isCombineEnabled={true} isDropDisabled={false} ignoreContainerClipping={false} direction="vertical">
        {(provided) => (
          <div 
            className="h-full w-full" 
            ref={provided.innerRef} 
            {...provided.droppableProps}
          >
            {droppedBlocks.map((block, index) => (
              <Draggable key={block.id} draggableId={block.id} index={index}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef} 
                    {...provided.draggableProps} 
                    {...provided.dragHandleProps}
                  >
                    <DroppedBlock 
                      block={block} 
                      updateBlockInputs={updateBlockInputs}
                      onDelete={handleDeleteBlock}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default MidArea;