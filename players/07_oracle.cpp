#include "civ.hpp"

int main() {
    civ::Strategy strategy;
    strategy.faith = 3.0;
    strategy.culture = 1.5;
    strategy.aggression = .1;
    strategy.maxCities = 5;
    strategy.techPriority = {"writing", "animal", "mining", "irrigation", "currency", "masonry", "engineering", "education"};
    strategy.civicPriority = {"mysticism", "craftsmanship", "trade", "empire", "state", "theology", "drama", "civilservice"};
    return civ::run(strategy, [](const civ::Json&, const civ::Json& action, double score) {
        if (action["item"].str() == "oracle") score += 35;
        if (action["type"].str() == "spread") score += 40;
        return score;
    });
}
