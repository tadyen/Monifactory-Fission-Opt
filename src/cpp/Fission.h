#ifndef _FISSION_H_
#define _FISSION_H_
#include <xtensor/xtensor.hpp>
#include <string>

namespace Fission {
  using Coords = std::vector<std::tuple<int, int, int>>;

  // In NCN, neutron reach appears to be much shorter
  // While the original NC can have four moderator blocks between two fuel cells and still have the cells counted as adjacent
  // NCN only allows a single moderator block sandwiched in the middle
  // https://github.com/igentuman/NuclearCraft-Neoteric/blob/71aa2666329d5d98d2e49279ba8579da1c0393d3/src/main/java/igentuman/nc/multiblock/fission/FissionReactorMultiblock.java#L359-L363
  constexpr int neutronReach(1);
  constexpr double modPower(1.0), modHeat(2.0);
  // https://github.com/igentuman/NuclearCraft-Neoteric/blob/1.20/src/main/java/igentuman/nc/handler/config/FissionConfig.java
  constexpr double configHeatMultiplier(3.24444444);

  enum {
    // Cooler
    Water, Redstone, Quartz,
    Gold, Glowstone, Lapis,
    Diamond, Helium, Enderium,
    Cryotheum, Iron, Emerald,
    Copper, Tin, Magnesium,
    // New in NC Neoteric:
    Aluminium, Arsenic, Boron,
    Endstone, Fluorite, Lead,
    Nitrogen, Lithium, Manganese,
    Netherbrick, Netherite, Obsidian,
    Prismarine, Purpur, Silver,
    Slime,
    // Active variants
    Active,
    // Other
    Cell = Active * 2, Moderator,
    // Air must be last
    Air
  };

  enum {
    GoalPower,
    GoalBreeder,
    GoalEfficiency
  };

  struct Settings {
    int sizeX, sizeY, sizeZ;
    double fuelBasePower, fuelBaseHeat;
    int limit[Air];
    double coolingRates[Cell];
    bool ensureActiveCoolerAccessible;
    bool ensureHeatNeutral;
    int goal;
    bool symX, symY, symZ;
    bool applyAdditionalGoals;
    int goalNetHeat, goalFuelCells;
    double goalDutyCycle;
    double goalWeightPrimary, goalWeightSecondary;
    double goalWeightNetHeat, goalWeightDutyCycle, goalWeightFuelCells;
  };

  struct Evaluation {
    // Raw
    Coords invalidTiles;
    double powerMult, heatMult, cooling;
    int fuelcells;
    // Computed
    double heat, netHeat, dutyCycle, avgMult, power, avgPower, avgBreed, efficiency, breed;
    double heatMultiplier, fitness;
    void compute(const Settings &settings);
  };

  class Evaluator {
    const Settings &settings;
    xt::xtensor<int, 3> mults, rules;
    xt::xtensor<bool, 3> isActive, isModeratorInLine, visited;
    const xt::xtensor<int, 3> *state;
    int compatibleTile;

    int getTileSafe(int x, int y, int z) const;
    int getMultSafe(int x, int y, int z) const;
    bool countMult(int x, int y, int z, int dx, int dy, int dz);
    int countMult(int x, int y, int z);
    bool isActiveSafe(int tile, int x, int y, int z) const;
    bool isBetweenSafe(int tile, int x, int y, int z) const;
    int countActiveNeighbors(int tile, int x, int y, int z) const;
    bool isTileSafe(int tile, int x, int y, int z) const;
    bool isSurroundActive(int x, int y, int z);
    bool isConnectedActive(int x, int y, int z);
    bool _isConnectedActive(int x, int y, int z);
    int countNeighbors(int tile, int x, int y, int z) const;
    int countCasingNeighbors(int x, int y, int z) const;
    bool checkAccessibility(int compatibleTile, int x, int y, int z);
    bool checkAccessibility(int x, int y, int z);
  public:
    Evaluator(const Settings &settings);
    void run(const xt::xtensor<int, 3> &state, Evaluation &result);
  };
}

#endif
