import type { DelayConfigurationId, PedalConfiguration, Preset, ReverbConfigurationId } from "@/types/tonebook";

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
	brand: "M-VAVE",
	model: "TANK-G",
	labels: ["Gain", "Treble", "Middle", "Bass", "Volume"],
	panelOrder: [4, 3, 2, 1, 0],
	min: 0,
	max: 100,
	startAngle: -135,
	sweepAngle: 270,
} as const;

export const pedalModels = {
	overdrive: { brand: "Caline", model: "Pure Sky", effect: "Overdrive" },
	delay: { brand: "M-VAVE", model: "Elemental", effect: "Delay" },
	reverb: { brand: "M-VAVE", model: "Mini Universe", effect: "Reverb" },
} as const;

export const overdriveControls = [
	{ label: "Volume", value: "12h", rotation: 0 },
	{ label: "Gain", value: "9h", rotation: -90 },
	{ label: "Treble", value: "12h", rotation: 0 },
	{ label: "Bass", value: "12h", rotation: 0 },
] as const;

export const delayControls = [
	{ label: "Time", value: "11h30", rotation: -15 },
	{ label: "Type", value: "Duck" },
	{ label: "Feedback", value: "10h", rotation: -60 },
	{ label: "Mix", value: "12h", rotation: 0 },
	{ label: "Param", value: "10h", rotation: -60 },
	{ label: "Mod", value: "9h", rotation: -90 },
] as const;

export const reverbControls = [
	{ label: "Decay", value: "1h", rotation: 30 },
	{ label: "Type", value: "Blom" },
	{ label: "Mix", value: "11h", rotation: -30 },
	{ label: "Param1", value: "10h", rotation: -60 },
	{ label: "Param2", value: "1h", rotation: 30 },
	{ label: "Param3", value: "2h", rotation: 60 },
] as const;

export const delayConfigurations = [
	{ id: "delay-1", label: "Delay 1", controls: delayControls },
	{
		id: "delay-2",
		label: "Delay 2",
		controls: [
			{ label: "Time", value: "11h30", rotation: -15 },
			{ label: "Type", value: "Analog" },
			{ label: "Feedback", value: "10h", rotation: -60 },
			{ label: "Mix", value: "9h", rotation: -90 },
			{ label: "Param", value: "12h", rotation: 0 },
			{ label: "Mod", value: "9h", rotation: -90 },
		],
	},
] as const satisfies readonly PedalConfiguration<DelayConfigurationId>[];

export const reverbConfigurations = [
	{ id: "reverb-1", label: "Reverb 1", controls: reverbControls },
	{
		id: "reverb-2",
		label: "Reverb 2",
		controls: [
			{ label: "Decay", value: "11h", rotation: -30 },
			{ label: "Type", value: "Hall" },
			{ label: "Mix", value: "10h", rotation: -60 },
			{ label: "Param1", value: "10h", rotation: -60 },
			{ label: "Param2", value: "1h", rotation: 30 },
			{ label: "Param3", value: "12h", rotation: 0 },
		],
	},
] as const satisfies readonly PedalConfiguration<ReverbConfigurationId>[];

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
	{
		id: "2B",
		name: "Clean lead",
		pickup: "Braço",
		amp: "Dumb clean",
		ir: "Fender Twin Nrml1",
		values: [28, 58, 70, 38, 55],
		desc: "Som limpo, com pouca ambiência para solos solenes.",
		type: "Solo limpo",
		od: false,
		ambience: true,
		delayConfigurationId: "delay-2",
		reverbConfigurationId: "reverb-2",
	},
	{
		id: "2C",
		name: "Clean funk",
		pickup: "Ponte",
		amp: "Dumb clean",
		ir: "Fender Twin Jensen",
		values: [31, 70, 72, 41, 50],
		desc: "Som limpo, com agudo forte, para tocar grooves ritmados.",
		song: "treasury",
		artist: "Bruno Mars",
		type: "Funk",
		od: false,
	},
];
