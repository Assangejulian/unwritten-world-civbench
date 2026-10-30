#include "civ.hpp"

int main() {
    civ::Strategy strategy;
    strategy.industry = 2.7;
    strategy.science = 1.8;
    strategy.aggression = .6;
    strategy.techPriority = {"mining", "writing", "bronze", "currency", "apprenticeship", "masonry", "animal", "archery", "engineering", "education", "ironwork", "horseback", "stirrups", "gunpowder", "astronomy", "industrial", "electricity", "rocketry"};
    return civ::run(strategy, [](const civ::Json&, const civ::Json& action, double score) {
        if (action["item"].str() == "workshop" || action["item"].str() == "factory") score += 25;
        return score;
    });
}
