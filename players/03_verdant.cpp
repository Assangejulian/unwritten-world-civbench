#include "civ.hpp"

int main() {
    civ::Strategy strategy;
    strategy.growth = 2.0;
    strategy.industry = 1.2;
    strategy.aggression = .3;
    strategy.maxCities = 7;
    strategy.techPriority = {"animal", "mining", "irrigation", "writing", "masonry", "engineering", "currency", "apprenticeship", "education"};
    strategy.civicPriority = {"craftsmanship", "trade", "empire", "state", "drama", "feudalism", "civilservice"};
    return civ::run(strategy, [](const civ::Json&, const civ::Json& action, double score) {
        if (action["type"].str() == "produce" && action["item"].str() == "aqueduct") score += 12;
        return score;
    });
}
