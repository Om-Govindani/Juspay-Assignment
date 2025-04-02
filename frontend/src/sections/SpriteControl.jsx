import { useState } from "react";
import BallIcon from "../assets/ball.svg";
import RocketIcon from "../assets/rocket.svg";
import CarIcon from "../assets/car.svg";
import CatSprite from "../assets/cat.png";

function SpriteControl() {
  const [showMenu, setShowMenu] = useState(false);
  const [sprites, setSprites] = useState([
    { id: 1, name: "Cat", src: CatSprite }, // Default sprite
  ]);

  const availableSprites = [
    { id: 2, name: "Ball", src: BallIcon },
    { id: 3, name: "Cat", src: CatSprite },
    { id: 4, name: "Rocket", src: RocketIcon },
    { id: 5, name: "Car", src: CarIcon },
  ];

  const addSprite = (sprite) => {
    if (!sprites.some((s) => s.id === sprite.id)) {
      setSprites([...sprites, sprite]);
    }
    setShowMenu(false);
  };

  return (
    <div className="h-full w-full bg-white border-gray-300 border-2 rounded-b-lg p-4">
      {/* + Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-full h-8 bg-indigo-500 rounded-lg text-white text-2xl"
      >
        +
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="w-full bg-gray-200 p-2 rounded-lg shadow-md flex gap-2 mt-2 justify-center">
          {availableSprites.map((sprite) => (
            <div
              key={sprite.id}
              className="h-12 w-12 cursor-pointer hover:scale-110 transition flex items-center justify-center bg-white rounded-md"
              onClick={() => addSprite(sprite)}
            >
              <img src={sprite.src} alt={sprite.name} className="h-10 w-10" />
            </div>
          ))}
        </div>
      )}

      {/* List of Active Sprites */}
      <div className="flex gap-2 mt-4 flex-wrap">
        {sprites.map((sprite) => (
          <div key={sprite.id} className="h-12 w-12 flex items-center justify-center bg-gray-100 rounded-md">
            <img src={sprite.src} alt={sprite.name} className="h-10 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SpriteControl;
