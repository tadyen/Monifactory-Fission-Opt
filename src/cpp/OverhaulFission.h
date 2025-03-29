#ifndef _OVERHAUL_FISSION_H_
#define _OVERHAUL_FISSION_H_
#include <xtensor/xtensor.hpp>
#include <optional>
#include <variant>
#include <vector>

namespace OverhaulFission {
  constexpr double moderatorEfficiencies[] { 1.1, 1.05, 1.0 };
  constexpr double sourceEfficiencies[] { 1.0, 0.95, 0.9 };
  constexpr double reflectorEfficiencies[] { 0.5, 0.25 };
  constexpr double reflectorFluxMults[] { 1.0, 0.5 };
  constexpr double sparsityPenaltyThreshold(0.75);
  constexpr int moderatorFluxes[] { 10, 22, 36 };
  constexpr double maxSparsityPenaltyMult(0.5);
  constexpr int coolingEfficiencyLeniency(10);
  constexpr double shieldEfficiency(0.5);
  constexpr int shieldHeatPerFlux(5);
  // In NCN, neutron reach appears to be much shorter
  // While the original NC can have four moderator blocks between two fuel cells and still have the cells counted as adjacent
  // NCN only allows a single moderator block sandwiched in the middle
  // https://github.com/igentuman/NuclearCraft-Neoteric/blob/71aa2666329d5d98d2e49279ba8579da1c0393d3/src/main/java/igentuman/nc/multiblock/fission/FissionReactorMultiblock.java#L359-L363
  constexpr int neutronReach(1);
  constexpr int coolingRates[] {
    55, 50, 85, 80, 70, 105, 90, 100, 110, 115, 145, 65, 95, 200, 195, 75, 120,
    60, 160, 130, 125, 150, 175, 170, 165, 180, 140, 135, 185, 190, 155, 205
  };

  namespace Tiles { enum {
    // Heat sink
    Wt, Fe, Rs, Qz, Ob, Nr, Gs, Lp, Au, Pm, Sm, En, Pr, Dm, Em, Cu,
    Sn, Pb, B, Li, Mg, Mn, Al, Ag, Fl, Vi, Cb, As, N, He, Ed, Cr,
    // Moderator
    M0, M1, M2,
    // Reflector
    R0, R1,
    // Other
    Shield, Irradiator, Conductor, Air, C0
  }; }

  enum {
    GoalOutput,
    GoalFuelUse,
    GoalEfficiency,
    GoalIrradiation
  };

  struct Fuel {
    double efficiency;
    int limit;
    int criticality;
    int heat;
    bool selfPriming;
  };

  struct Settings {
    int sizeX, sizeY, sizeZ;
    std::vector<Fuel> fuels;
    int limits[Tiles::Air];
    int sourceLimits[3];
    int goal;
    bool controllable;
    bool symX, symY, symZ;
    // Computed
    std::vector<std::pair<int, int>> cellTypes;
    double maxOutput;
    int minCriticality;
    int minHeat;
    
    void compute();
  };

  using State = xt::xtensor<int, 3>;
  using Coord = std::tuple<int, int, int>;
  extern const Coord directions[6];

  struct FluxEdge {
    double efficiency{};
    int flux{}, nModerators;
    bool isReflected{};
  };

  struct Air {};

  struct Cell {
    const Fuel *fuel;
    std::optional<FluxEdge> fluxEdges[6];
    double positionalEfficiency{}, fluxEfficiency, efficiency;
    int neutronSource, flux{}, heatMult{}, cluster{-1};
    bool isNeutronSourceBlocked{};
    bool isExcludedFromFluxRoots{};
    bool hasAlreadyPropagatedFlux;
    bool isActive;

    Cell(const Fuel *fuel, int neutronSource)
      :fuel(fuel), neutronSource(neutronSource) {}
  };

  struct Moderator {
    int type;
    bool isActive{};
    bool isFunctional{};

    Moderator(int type)
      :type(type) {}
  };

  struct Reflector {
    int type;
    bool isActive{};

    Reflector(int type) :type(type) {}
  };

  struct Shield {
    int flux{}, cluster{-1};
  };

  struct Irradiator {
    int flux{}, cluster{-1};
  };

  struct Conductor {
    int cluster{-1};
  };

  struct HeatSink {
    int type, cluster{-1};
    bool isActive;

    HeatSink(int type)
      :type(type) {}
  };

  using Tile = std::variant<Air, Cell, Moderator, Reflector, Shield, Irradiator, Conductor, HeatSink>;
  template<typename ...T> struct Overload : T... { using T::operator()...; };
  template<typename ...T> Overload(T...) -> Overload<T...>;

  struct Cluster {
    std::vector<Coord> tiles;
    double rawOutput{}, coolingPenaltyMult, output, rawEfficiency{}, efficiency;
    // Note: not having fuelDurationMult as the generator doesn't generate heat-positive reactor.
    int heat{}, cooling{}, netHeat;
    bool hasCasingConnection{};
  };

  struct Evaluation {
    xt::xtensor<Tile, 3> tiles;
    std::vector<Coord> cells, tier1s, tier2s, tier3s, shields, irradiators, conductors, fluxRoots;
    std::vector<Cluster> clusters;
    const Settings *settings;
    double rawEfficiency, efficiency, rawOutput, output, density, sparsityPenalty;
    int nFunctionalBlocks, totalPositiveNetHeat, irradiatorFlux, nActiveCells, totalRawFlux, maxCellFlux;
    bool shieldOn;
  private:
    void checkNeutronSource(int x, int y, int z);
    void computeFluxEdge(int x, int y, int z);
    void propagateFlux(int x, int y, int z);
    void propagateFlux();
    void computeFluxActivation();
    int countAdjacentCells(int x, int y, int z);
    int countAdjacentCasings(int x, int y, int z);
    int countAdjacentReflectors(int x, int y, int z);
    int countAdjacentModerators(int x, int y, int z);
    int countAdjacentHeatSinks(int type, int x, int y, int z);
    int countAxialAdjacentHeatSinks(int type, int x, int y, int z);
    bool hasAxialAdjacentReflectors(int x, int y, int z);
    void computeHeatSinkActivation(int x, int y, int z);
    bool propagateCluster(int id, int x, int y, int z);
    void computeClusterStats(Cluster &cluster);
    void computeSparsity();
    void computeStats();
    void removeInactiveHeatSink(State &state, int x, int y, int z);
  public:
    void initialize(const Settings &settings, bool shieldOn);
    void run(const State &state);
    void canonicalize(State &state);
  };
}

#endif
