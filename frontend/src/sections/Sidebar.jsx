import { useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";

function Sidebar({ categories: propCategories }) {
  // Use categories passed via props; fallback to default if needed.
  const defaultCategories = [
    { 
      name: "Motion", 
      color: "bg-blue-400", 
      content: [
        { id:"move",text: "Move ___ steps", inputTypes: ["number"] },
        { id:"turn",text: "Turn ___ degree", inputTypes: ["number"] },
        { id:"goto",text: "Go to x: ___ y: ___", inputTypes: ["number", "number"] }
      ]
    },
    { 
      name: "Looks", 
      color: "bg-purple-400", 
      content: [
        { id:"sayCustom",text: "Say ___ for ___ sec", inputTypes: ["text", "number"] },
        { id:"hello",text: "Say Hello" , inputTypes: []}
      ]
    },
    { 
      name: "Event", 
      color: "bg-yellow-400", 
      content: [
        { id:"play",text: "When ▶️ clicked", inputTypes: [] }
      ]
    },
    { 
      name: "Control", 
      color: "bg-green-400", 
      content: [
        { id:"loop",text: "Repeat ___ times", inputTypes: ["number"] }
      ]
    },
  ];
  
  const categories = propCategories || defaultCategories;
  const [selectedCategory, setSelectedCategory] = useState("Motion");
  const [selectedColor, setSelectedColor] = useState("bg-blue-400");
  const [inputs, setInputs] = useState({});

  const handleInputChange = (blockIndex, inputIndex, value, inputType) => {
    if (inputType === "number") {
      value = value.replace(/[^0-9.]/g, "");
      const decimalCount = (value.match(/\./g) || []).length;
      if (decimalCount > 1) {
        const parts = value.split(".");
        value = parts[0] + "." + parts.slice(1).join("");
      }
    }
    setInputs((prev) => ({
      ...prev,
      [blockIndex]: { ...(prev[blockIndex] || {}), [inputIndex]: value },
    }));
  };

  // Get the current category object
  const currentCategory = categories.find((c) => c.name === selectedCategory);

  return (
    <div className="h-full w-full bg-indigo-200 rounded-lg flex flex-row">
      {/* Left Section - Category Buttons */}
      <div className="w-1/6 h-full bg-white/40 rounded-lg flex flex-col justify-start gap-y-4 pt-4">
        {categories.map((category) => (
          <div
            key={category.name}
            className="flex flex-col items-center text-sm h-15 w-full cursor-pointer"
            onClick={() => {
              setSelectedCategory(category.name);
              setSelectedColor(category.color);
              setInputs({}); // Clear inputs when changing category
            }}
          >
            <div className={`w-8 h-8 m-0.5 ${category.color} rounded-full`}></div>
            {category.name}
          </div>
        ))}
      </div>

      {/* Right Section - Display Selected Category Content as Draggable blocks */}
      <div className="w-5/6 h-full flex flex-col items-center p-4 gap-y-4">
        <h2 className="text-3xl bg-white/40 p-2 rounded-lg w-full text-center">
          {selectedCategory}
        </h2>
        <Droppable droppableId="sidebar" isDropDisabled={true} isCombineEnabled={true} ignoreContainerClipping={false} direction="vertical">
          {(provided) => (
            <div 
              className="w-full flex flex-col items-center gap-y-4" 
              ref={provided.innerRef} 
              {...provided.droppableProps}
            >
              {currentCategory &&
                currentCategory.content.map((item, blockIndex) => {
                  const parts = item.text.split("___");
                  const inputTypes = item.inputTypes || [];
                  console.log(selectedCategory)
                  console.log("sidebar-"+selectedCategory+"-"+blockIndex)
                  return (
                    <Draggable
                      key={blockIndex}
                      draggableId={`sidebar-${selectedCategory}-${blockIndex}`}
                      index={blockIndex}
                    >
                      {(provided) => (
                        <div 
                          ref={provided.innerRef} 
                          {...provided.draggableProps} 
                          {...provided.dragHandleProps}
                          className={`${selectedColor} p-2 text-xl w-full rounded-lg text-center flex items-center justify-center gap-2`}
                        >
                          {parts.map((part, inputIndex) => {
                            const showInput = inputIndex < parts.length - 1;
                            const inputType = inputTypes[inputIndex] || "text";
                            return (
                              <span key={inputIndex} className="flex items-center gap-2">
                                {part.trim()}
                                {showInput && (
                                  <input
                                    type="text"
                                    className="w-20 px-2 py-1 text-black rounded-md outline-none border border-gray-800"
                                    value={inputs[blockIndex]?.[inputIndex] || ""}
                                    onChange={(e) =>
                                      handleInputChange(blockIndex, inputIndex, e.target.value, inputType)
                                    }
                                    placeholder={inputType === "number" ? "0" : "text"}
                                  />
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}

export default Sidebar;
