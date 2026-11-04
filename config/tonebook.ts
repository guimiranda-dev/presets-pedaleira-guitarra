import type { Preset } from "@/types/tonebook";

export const siteConfig = {
	name: "tonebook",
	title: "Tonebook — Meus presets",
	description:
		"Seu caderno de timbres. Presets, amplificadores e pedais de guitarra em um só lugar.",
	tagline: "Meu caderno de timbres",
	heading: "Um lugar para cada som.",
	subtitle: "Seus timbres, do primeiro acorde ao último solo.",
} as const;

export const amplifierConfig = {
	labels: ["Gain", "Treble", "Middle", "Bass", "Volume"],
	min: 0,
	max: 100,
	startAngle: -135,
	sweepAngle: 270,
} as const;

export const overdriveControls = [
	{ label: "Volume", value: "12h", rotation: 0 },
	{ label: "Gain", value: "9h", rotation: -90 },
	{ label: "Treble", value: "12h", rotation: 0 },
	{ label: "Bass", value: "12h", rotation: 0 },
] as const;

export const presets: readonly Preset[] = [
	{
		id: "1A",
		name: "Clean",
		pickup: "Braço",
		amp: "Dumb clean",
		ir: "Fender Twin Nrml1",
		values: [20, 55, 60, 40, 50],
		desc: "Som limpo, sem distorção para acompanhamentos suaves.",
		song: "Gravity",
		artist: "John Mayer",
		type: "Limpo",
		od: false,
	},
	{
		id: "1B",
		name: "Edge of breakup",
		pickup: "Braço",
		amp: "Dumb clean",
		ir: "Fender Twin Nrml1",
		values: [25, 55, 60, 40, 50],
		desc: "Som limpo, com leve distorção para acompanhamentos suaves, um pouco mais projetados que o clean.",
		song: "Slow dancing in a burning room",
		artist: "John Mayer",
		type: "Drive leve",
		od: true,
	},
	{
		id: "1C",
		name: "Crunch",
		pickup: "Ponte",
		amp: "Dumble crunch",
		ir: "Celestion Alnico Blue 1994",
		values: [35, 55, 60, 40, 45],
		desc: "Som com distorção para micro acordes abertos. Usado em refrões de pop e worship.",
		song: "Use somebody (Refrão)",
		artist: "Kings of leon",
		type: "Distorção",
		od: true,
	},
	{
		id: "1D",
		name: "Drive lead",
		pickup: "Ponte",
		amp: "Bogner Lead",
		ir: "Marshal 1960",
		values: [45, 55, 70, 40, 40],
		desc: "Som com distorção para solos. Usado em rock.",
		song: "Comfortably Numb",
		artist: "Pink Floyd",
		type: "Solo",
		od: false,
	},
	{
		id: "2A",
		name: "Clean Ambience",
		pickup: "Braço",
		amp: "Dumb clean",
		ir: "Fender Twin Nrml1",
		values: [18, 50, 55, 40, 50],
		desc: "Som limpo, para ambiência e momentos de reflexão.",
		type: "Ambiência",
		od: false,
		ambience: true,
	},
];
