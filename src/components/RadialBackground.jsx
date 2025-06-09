

export default function RadialBackground() {
    return (
        <div className="z-0">
            <div className='absolute top-1/5 left-1/10 size-150 rounded-full bg-radial from-yellow-600 to-gray-100 to-70% dark:to-neutral-900 transition-colors pointer-events-none'></div>
            <div className='absolute top-2/4 left-7/10 size-100 rounded-full bg-radial from-yellow-600 to-gray-100 to-70% dark:to-neutral-900 transition-colors pointer-events-none'></div>
        </div>
    );
}