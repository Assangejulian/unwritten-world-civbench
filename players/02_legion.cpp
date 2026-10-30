#include "civ.hpp"

int main() {
    civ::Strategy strategy;
    strategy.aggression = 2.1;
    strategy.industry = 1.5;
    strategy.science = 1.2;
    strategy.maxCities = 4;
    strategy.techPriority = {"mining", "animal", "bronze", "archery", "ironwork", "masonry", "engineering", "horseback", "machinery", "stirrups", "gunpowder", "ballistics", "combustion"};
    strategy.civicPriority = {"craftsmanship", "trade", "empire", "state", "civilservice", "nationalism", "ideology"};
    return civ::run(strategy, [](const civ::Json&, const civ::Json& action, double score) {
        if (action["type"].str() == "attack" && action.contains("targetCity")) score += 25;
        if (action["item"].str() == "catapult") score += 15;
        return score;
    });
}
