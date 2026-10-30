#include "civ.hpp"

int main() {
    civ::Strategy strategy;
    strategy.naval = 2.5;
    strategy.commerce = 1.5;
    strategy.growth = 1.3;
    strategy.aggression = .8;
    strategy.maxCities = 6;
    strategy.techPriority = {"sailing", "writing", "celestial", "animal", "mining", "currency", "masonry", "bronze", "archery", "engineering", "education", "apprenticeship", "industrial", "steam"};
    return civ::run(strategy, [](const civ::Json&, const civ::Json& action, double score) {
        if (action["item"].str() == "harbor" || action["item"].str() == "lighthouse") score += 25;
        return score;
    });
}
