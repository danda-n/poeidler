import { currencies, currencyMap, type CurrencyDefinition } from "./currencies";
import { generators, generatorMap, generatorByCurrency, type GeneratorDefinition } from "./generators";
import { upgrades, upgradeMap, type UpgradeDefinition } from "./upgradeEngine";
import { baseMaps, baseMapMap, mapEncounters, type BaseMapDefinition, type MapEncounterDefinition } from "./maps";
import { affixPool, affixMap, type AffixDefinition } from "./mapAffixes";
import { talents, talentMap, type TalentDefinition } from "./talents";
import { deviceModPool, deviceModMap, type DeviceModDefinition } from "./mapDevice";

export const GameRegistry = {
  currencies,
  generators,
  upgrades,
  baseMaps,
  mapEncounters,
  affixPool,
  talents,
  deviceModPool,
} as const;

export function getCurrency(id: string): CurrencyDefinition {
  const entry = currencyMap[id];
  if (!entry) throw new Error(`Unknown currency: ${id}`);
  return entry;
}

export function getGenerator(id: string): GeneratorDefinition {
  const entry = generatorMap[id];
  if (!entry) throw new Error(`Unknown generator: ${id}`);
  return entry;
}

export function getGeneratorForCurrency(currencyId: string): GeneratorDefinition | undefined {
  return generatorByCurrency[currencyId];
}

export function getUpgrade(id: string): UpgradeDefinition {
  const entry = upgradeMap[id];
  if (!entry) throw new Error(`Unknown upgrade: ${id}`);
  return entry;
}

export function getBaseMap(id: string): BaseMapDefinition {
  const entry = baseMapMap[id];
  if (!entry) throw new Error(`Unknown base map: ${id}`);
  return entry;
}

export function getEncounter(id: string): MapEncounterDefinition | undefined {
  return mapEncounters.find((e) => e.id === id);
}

export function getAffix(id: string): AffixDefinition {
  const entry = affixMap[id];
  if (!entry) throw new Error(`Unknown affix: ${id}`);
  return entry;
}

export function getTalent(id: string): TalentDefinition {
  const entry = talentMap[id];
  if (!entry) throw new Error(`Unknown talent: ${id}`);
  return entry;
}

export function getDeviceMod(id: string): DeviceModDefinition {
  const entry = deviceModMap[id];
  if (!entry) throw new Error(`Unknown device mod: ${id}`);
  return entry;
}
