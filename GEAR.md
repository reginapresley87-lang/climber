# Climber: real gear list (game design reference)
| Gear | Real use | In-game effect |
|---|---|---|
| Harness | Holds you to the rope | Required for roped climbing; clips gear loops |
| Dynamic rope (60 m) | Stretches to catch falls | Fall length = distance to last protection x2 + stretch; length limits a pitch |
| Belay device + locking carabiner | Partner/anchor controls the rope | Catches falls; auto-belay when anchored |
| Carabiners (locking/non-locking) | Connect everything | Inventory slots; needed for each placement |
| Quickdraws | Clip rope to bolts/gear | Clipping reduces fall distance; limited count |
| Cams (sizes 0.5-4) | Spring-loaded, fit parallel cracks | Place in cracks; size must match crack width or it can pop |
| Nuts + nut tool | Wedge in tapering cracks | Cheap, light; nut tool needed to retrieve |
| Bolts (fixed, on sport routes) | Pre-placed anchors | Found on some walls; very reliable |
| Chalk bag | Dries sweaty hands | Restores grip; runs out, refill at ledges |
| Climbing shoes | Sticky rubber for footholds | Better foot friction; wear down over time |
| Helmet | Protects from rockfall | Reduces stun from falling pebbles |
| Slings / anchor kit | Build anchors at ledges | Save point and rest spot between pitches |
| Headlamp | Light at night | Needed to see holds after dark |
| Water + snacks | Energy | Restore stamina at rest |

Key mechanics: stamina drains while hanging and refills at rests; grip drops with sweat, heat and rain; protection placement quality (good/okay/bad) decides whether it holds a fall.

## Quickdraw look (from Clarabelle photo, Oct 24)
The top carabiner (bent gate) clips into a shiny bolt hanger, and a short sling hangs straight down to the bottom carabiner. The rope runs through the bottom carabiner, with its gate facing away from the climber. clip() plays twice: once for the bolt, once for the rope.
