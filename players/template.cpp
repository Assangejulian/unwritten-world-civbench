#include "civ.hpp"

// Copy this file, select it in the lobby, then compile it with the player panel.
// stdin: one JSON observation. stdout: one JSON object with orders and memory.
// The engine validates every order; illegal orders are rejected individually.
int main() {
    civ::Strategy strategy;
    strategy.science = 1.8;
    strategy.growth = 1.2;
    strategy.aggression = .5;
    strategy.maxCities = 5;
    return civ::run(strategy, [](const civ::Json& observation, const civ::Json& action, double score) {
        // Adjust scores here or replace civ::decide with a custom algorithm.
        if (observation["turn"].integer() < 30 && action["item"].str() == "monument") score += 15;
        return score;
    });
}
