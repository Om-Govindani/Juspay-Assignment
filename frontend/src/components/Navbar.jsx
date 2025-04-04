import Scratch from "../assets/Scratch.svg"

export default function Navbar({ onPlay }) {
  return (
    <div className="h-[48px] w-full rounded-lg shadow-lg bg-indigo-500/80 backdrop-blur-md flex items-center justify-between px-4">
      <div className="flex-1 flex justify-center">
        <img src={Scratch} className="w-[110px] h-[50px]" alt="Scratch Logo"/>
      </div>
      <button 
        onClick={onPlay}
        className="text-white text-4xl p-2 rounded-full "
        aria-label="Play"
      >
        ▶️
      </button>
      <a href="https://github.com/Om-Govindani/Juspay-Assignment"><img src="https://img.icons8.com/?size=100&id=12599&format=png&color=000000" className="w-[45px] h-[38px]" /></a>
    </div>
  )
}