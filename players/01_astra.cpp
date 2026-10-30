#include "civ.hpp"

int main() {
    civ::Strategy strategy;
    strategy.science = 2.6;
    strategy.industry = 1.4;
    strategy.growth = 1.1;
    strategy.aggression = .2;
    strategy.maxCities = 5;
    strategy.techPriority = {"writing", "mining", "animal", "masonry", "bronze", "currency", "archery", "engineering", "education", "apprenticeship", "ironwork", "machinery", "printing", "astronomy", "gunpowder", "industrial", "electricity", "rocketry", "atomic", "computers", "nanotech"};
    return civ::run(strategy, [](const civ::Json&, const civ::Json& action, double score) {
        if (action["item"].str() == "greatlibrary" || action["item"].str() == "oxford") score += 35;
        return score;
    });
}
