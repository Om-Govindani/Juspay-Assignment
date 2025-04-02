import Scratch from "../assets/Scratch.svg"
export default function Navbar(onPlay){
    return (
            <div className="h-[48px] w-full rounded-lg shadow-lg bg-indigo-500/80 backdrop-blur-md">
                <img src={Scratch} className="w-[110px] h-[50px] m-auto"/>
                
            </div>
    )
}