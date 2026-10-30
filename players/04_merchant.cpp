#include "civ.hpp"

int main() {
    civ::Strategy strategy;
    strategy.commerce = 2.6;
    strategy.growth = 1.15;
    strategy.naval = .8;
    strategy.aggression = .15;
    strategy.techPriority = {"writing", "currency", "sailing", "animal", "mining", "masonry", "archery", "engineering", "celestial", "printing"};
    strategy.civicPriority = {"trade", "craftsmanship", "empire", "state", "civilservice", "feudalism", "exploration", "economy"};
    return civ::run(strategy, [](const civ::Json&, const civ::Json& action, double score) {
        if (action["type"].str() == "trade" && action["hint"]["foreign"].flag()) score += 20;
        if (action["item"].str() == "merchant") score += 15;
        return score;
    });
}
