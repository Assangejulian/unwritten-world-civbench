#include "civ.hpp"

int main() {
    civ::Strategy strategy;
    strategy.culture = 2.7;
    strategy.industry = 1.5;
    strategy.aggression = .2;
    strategy.techPriority = {"writing", "mining", "masonry", "animal", "currency", "bronze", "archery", "engineering", "education", "machinery", "printing", "flight", "computers"};
    strategy.civicPriority = {"craftsmanship", "mysticism", "drama", "trade", "empire", "state", "civilservice", "humanism", "media", "globalization"};
    return civ::run(strategy, [](const civ::Json&, const civ::Json& action, double score) {
        if (action["hint"]["kind"].str() == "wonder") score += 20;
        return score;
    });
}
