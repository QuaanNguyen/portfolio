import bellImage from '../assets/bell.png';

export default function BellRing() {
    return (
        <div className='absolute size-30 bottom-10 right-10 cursor-pointer z-40'> 
            <img src={bellImage} alt="Bell" />  
        </div>
    )
}