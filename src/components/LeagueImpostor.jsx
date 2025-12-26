import { useState } from "react";

const CHAMPIONS = [
    "Aatrox", "Ahri", "Akali", "Akshan", "Alistar", "Amumu", "Anivia", "Annie", "Aphelios", "Ashe", "Aurelion Sol", "Azir",
    "Bard", "Bel'Veth", "Blitzcrank", "Brand", "Braum", "Briar", "Caitlyn", "Camille", "Cassiopeia", "Cho'Gath", "Corki",
    "Darius", "Diana", "Dr. Mundo", "Draven", "Ekko", "Elise", "Evelynn", "Ezreal", "Fiddlesticks", "Fiora", "Fizz",
    "Galio", "Gangplank", "Garen", "Gnar", "Gragas", "Graves", "Gwen", "Hecarim", "Heimerdinger", "Hwei", "Illaoi",
    "Irelia", "Ivern", "Janna", "Jarvan IV", "Jax", "Jayce", "Jhin", "Jinx", "K'Sante", "Kai'Sa", "Kalista", "Karma",
    "Karthus", "Kassadin", "Katarina", "Kayle", "Kayn", "Kennen", "Kha'Zix", "Kindred", "Kled", "Kog'Maw", "LeBlanc",
    "Lee Sin", "Leona", "Lillia", "Lissandra", "Lucian", "Lulu", "Lux", "Malphite", "Malzahar", "Maokai", "Master Yi",
    "Milio", "Miss Fortune", "Mordekaiser", "Morgana", "Naafiri", "Nami", "Nasus", "Nautilus", "Nidalee",
    "Nilah", "Nocturne", "Nunu & Willump", "Olaf", "Orianna", "Ornn", "Pantheon", "Poppy", "Pyke", "Qiyana", "Quinn",
    "Rakan", "Rammus", "Rek'Sai", "Rell", "Renata Glasc", "Renekton", "Rengar", "Riven", "Rumble", "Ryze", "Samira",
    "Sejuani", "Senna", "Seraphine", "Sett", "Shaco", "Shen", "Shyvana", "Singed", "Sion", "Sivir", "Skarner", "Smolder",
    "Sona", "Soraka", "Swain", "Sylas", "Syndra", "Tahm Kench", "Taliyah", "Talon", "Taric", "Teemo", "Thresh",
    "Tristana", "Trundle", "Tryndamere", "Twisted Fate", "Twitch", "Udyr", "Urgot", "Varus", "Vayne", "Veigar",
    "Vel'Koz", "Vex", "Vi", "Viego", "Viktor", "Vladimir", "Volibear", "Warwick", "Wukong", "Xayah", "Xerath", "Xin Zhao",
    "Yasuo", "Yone", "Yorick", "Yuumi", "Zac", "Zed", "Zeri", "Ziggs", "Zilean", "Zoe", "Zyra"
];

// Load all champion images
const championImages = import.meta.glob('../assets/LolChampions/*.jpg', { eager: true, import: 'default' });

const normalizeName = (name) => {
    if (name === "Dr. Mundo") return "Dr- Mundo";
    if (name === "Bel'Veth") return "BelVeth";
    if (name === "K'Sante") return "KSante";
    if (name === "Kai'Sa") return "KaiSa";
    if (name === "Kha'Zix") return "KhaZix";
    if (name === "Kog'Maw") return "KogMaw";
    if (name === "Rek'Sai") return "RekSai";
    if (name === "Vel'Koz") return "VelKoz";
    if (name === "Cho'Gath") return "ChoGath";
    if (name === "Nunu & Willump") return "Nunu and Willump";
    return name;
};

const getChampionImage = (name) => {
    const normalized = normalizeName(name);
    const path = `../assets/LolChampions/${normalized}.jpg`;
    return championImages[path];
};

export default function LeagueImpostor() {
    const [phase, setPhase] = useState("setup"); // setup, playing
    const [playerCount, setPlayerCount] = useState(5);
    const [impostorCount, setImpostorCount] = useState(1);
    const [cards, setCards] = useState([]);
    const [revealedCard, setRevealedCard] = useState(null);

    const startGame = () => {
        if (impostorCount >= playerCount) {
            alert("Impostor count must be less than player count!");
            return;
        }

        const roles = Array(playerCount).fill("champion");
        for (let i = 0; i < impostorCount; i++) {
            roles[i] = "impostor";
        }

        // Shuffle roles
        for (let i = roles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [roles[i], roles[j]] = [roles[j], roles[i]];
        }

        const selectedChampion = CHAMPIONS[Math.floor(Math.random() * CHAMPIONS.length)];

        const newCards = roles.map((role, index) => ({
            id: index,
            role,
            champion: role === "champion" ? selectedChampion : null,
            revealed: false,
        }));

        setCards(newCards);
        setPhase("playing");
    };

    const handleCardClick = (card) => {
        if (card.revealed) return;
        setRevealedCard(card);
    };

    const handleConfirmReveal = () => {
        setCards(cards.map(c => c.id === revealedCard.id ? { ...c, revealed: true } : c));
        setRevealedCard(null);
    };

    const restartGame = () => {
        setPhase("setup");
        setCards([]);
        setRevealedCard(null);
    };

    const allRevealed = cards.length > 0 && cards.every(c => c.revealed);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full p-4 text-gray-800 dark:text-white relative z-10">
            {phase === "setup" && (
                <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md p-8 rounded-2xl shadow-xl flex flex-col gap-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
                    <h1 className="text-3xl font-bold text-center mb-2">League Impostor</h1>

                    <div className="flex flex-col gap-2">
                        <label className="font-semibold">Number of Players</label>
                        <input
                            type="number"
                            min="3"
                            max="20"
                            value={playerCount}
                            onChange={(e) => setPlayerCount(parseInt(e.target.value) || 0)}
                            className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-semibold">Number of Impostors</label>
                        <input
                            type="number"
                            min="1"
                            max={playerCount - 1}
                            value={impostorCount}
                            onChange={(e) => setImpostorCount(parseInt(e.target.value) || 0)}
                            className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        onClick={startGame}
                        className="mt-4 py-3 px-6 bg-white dark:bg-black text-black dark:text-white font-bold rounded-xl transition-all shadow-md hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-black dark:border-white active:scale-95"
                    >
                        Start Game
                    </button>
                </div>
            )}

            {phase === "playing" && !revealedCard && (
                <div className="w-full max-w-4xl flex flex-col items-center gap-8">
                    <h2 className="text-2xl font-bold bg-white/50 dark:bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                        Tap a card to reveal your role
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
                        {cards.map((card) => (
                            <button
                                key={card.id}
                                onClick={() => handleCardClick(card)}
                                disabled={card.revealed}
                                className={`
                  aspect-[3/4] rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center text-xl font-bold relative overflow-hidden
                  ${card.revealed
                                        ? "bg-gray-300 dark:bg-gray-800 cursor-default opacity-50"
                                        : "bg-gradient-to-br from-blue-400/80 to-cyan-300/80 hover:scale-105 cursor-pointer text-white hover:shadow-[0_0_20px_rgba(0,149,255,0.6)] hover:before:content-[''] hover:before:absolute hover:before:inset-0 hover:before:bg-white/20 hover:before:animate-pulse"
                                    }
                `}
                            >
                                {card.revealed ? "Taken" : "?"}
                            </button>
                        ))}
                    </div>

                    {allRevealed && (
                        <button
                            onClick={restartGame}
                            className="mt-8 py-3 px-8 bg-white dark:bg-black text-black dark:text-white font-bold rounded-xl transition-all shadow-md hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-black dark:border-white active:scale-95 animate-bounce"
                        >
                            Play Again
                        </button>
                    )}
                </div>
            )}

            {revealedCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-2xl max-w-md w-full flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400">You are...</h3>

                        <div className="text-center flex flex-col items-center gap-4 w-full">
                            {revealedCard.role === "impostor" ? (
                                <p className="text-5xl font-black text-red-600 tracking-wider">IMPOSTOR</p>
                            ) : (
                                <>
                                    <p className="text-4xl font-black text-blue-600 mb-2">CHAMPION</p>
                                    <div className="w-full aspect-square max-w-[250px] rounded-xl overflow-hidden shadow-lg border-2 border-blue-500/30">
                                        {getChampionImage(revealedCard.champion) ? (
                                            <img
                                                src={getChampionImage(revealedCard.champion)}
                                                alt={revealedCard.champion}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 text-gray-500">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-2xl font-bold mt-2">{revealedCard.champion}</p>
                                </>
                            )}
                        </div>

                        <p className="text-sm text-center text-gray-500 mt-2">
                            Memorize this, then click OK to hide it.
                        </p>

                        <button
                            onClick={handleConfirmReveal}
                            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-80 transition-opacity"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
