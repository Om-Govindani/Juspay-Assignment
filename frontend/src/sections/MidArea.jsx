import { Droppable, Draggable } from "react-beautiful-dnd";
import { useState } from "react";

function DroppedBlock({ block }) {
  // Local state for input values in the dropped block
  const [inputs, setInputs] = useState({});

  const handleInputChange = (inputIndex, value, inputType) => {
    if (inputType === "number") {
      value = value.replace(/[^0-9.]/g, "");
      const decimalCount = (value.match(/\./g) || []).length;
      if (decimalCount > 1) {
        const parts = value.split(".");
        value = parts[0] + "." + parts.slice(1).join("");
      }
    }
    setInputs((prev) => ({ ...prev, [inputIndex]: value }));
  };

  const parts = block.text.split("___");
  const inputTypes = block.inputTypes || [];

  return (
    <div className={`${block.color} p-2 text-xl w-full rounded-lg text-center flex items-center justify-center gap-2 mb-2`}>
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
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

function MidArea({ droppedBlocks }) {
  return (
    <div className="h-full w-full bg-slate-300 rounded-lg p-4 overflow-auto">
      <Droppable droppableId="midarea" isCombineEnabled={true} isDropDisabled={false} ignoreContainerClipping={false}>
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
                    <DroppedBlock block={block} />
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
