import cardConfig from './json/dashboard_cards.json';

// CARD_CATALOG keyed by card id — shape preserved for backward compatibility
export const CARD_CATALOG = Object.fromEntries(
  cardConfig.cards.map(c => [
    c.id,
    {
      id:          c.id,
      title:       c.title,
      icon:        c.icon,
      category:    c.category,
      defaultW:    c.default_width,
      description: c.description,
    },
  ])
);

export const CARD_CATEGORIES = cardConfig.categories.map(cat => ({
  key:   cat.key,
  label: cat.label,
  icon:  cat.icon,
}));
