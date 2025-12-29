export interface Member {
    id: number;
    name: string;
    role: string;
    instrumentIcon: string;
    style: string;
    influences: string;
    image: string;
}

export interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    baseX: number;
    baseY: number;
}