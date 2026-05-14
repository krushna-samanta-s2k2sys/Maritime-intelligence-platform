import personaConfig from './json/personas.json';

// Build PERSONAS map keyed by persona id — shape preserved for backward compatibility
export const PERSONAS = Object.fromEntries(
  personaConfig.personas.map(p => [
    p.id,
    {
      id:           p.id,
      name:         p.name,
      icon:         p.icon,
      color:        p.color,
      description:  p.description,
      attrSections: p.attr_sections,
      dashboardCards: p.dashboard_cards.map(c => ({ id: c.card_id, w: c.width })),
      vesselColumns:  p.vessel_columns,
    },
  ])
);

export const PERSONA_LIST = Object.values(PERSONAS);
export const DEFAULT_PERSONA_ID = personaConfig.default_persona_id;
