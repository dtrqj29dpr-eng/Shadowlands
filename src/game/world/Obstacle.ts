// Structural placeholder for future destructible/interactive obstacle classes.
// MapBuilder currently creates raw GameObjects with static physics bodies;
// when obstacles need behavior (HP, events, loot), extend this base class.
export type ObstacleGameObject =
  | Phaser.GameObjects.Rectangle
  | Phaser.GameObjects.Image;
