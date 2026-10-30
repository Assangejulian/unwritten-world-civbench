#pragma once
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <limits>
#include <map>
#include <queue>
#include <set>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

namespace civ {
// A small dependency-free JSON value for the line-based player protocol.
struct Json {
    enum Type { Null, Number, Boolean, String, Array, Object } type = Null;
    double number = 0;
    bool boolean = false;
    std::string string;
    std::vector<Json> array;
    std::map<std::string, Json> object;
    Json() = default;
    Json(double v) : type(Number), number(v) {}
    Json(int v) : Json(static_cast<double>(v)) {}
    Json(bool v) : type(Boolean), boolean(v) {}
    Json(const char* v) : type(String), string(v) {}
    Json(std::string v) : type(String), string(std::move(v)) {}
    static Json arr() { Json v; v.type = Array; return v; }
    static Json obj(std::initializer_list<std::pair<const std::string, Json>> pairs = {}) {
        Json v; v.type = Object; v.object = pairs; return v;
    }
    const Json& operator[](const std::string& key) const {
        static const Json empty;
        auto it = object.find(key); return it == object.end() ? empty : it->second;
    }
    Json& operator[](const std::string& key) { type = Object; return object[key]; }
    const Json& operator[](std::size_t i) const { static const Json empty; return i < array.size() ? array[i] : empty; }
    double num(double fallback = 0) const { return type == Number ? number : fallback; }
    int integer(int fallback = 0) const { return static_cast<int>(num(fallback)); }
    bool flag(bool fallback = false) const { return type == Boolean ? boolean : fallback; }
    std::string str(const std::string& fallback = "") const { return type == String ? string : fallback; }
    bool isNull() const { return type == Null; }
    bool contains(const std::string& key) const { return object.count(key) != 0; }
    bool has(const std::string& value) const { return std::any_of(array.begin(), array.end(), [&](const Json& v) { return v.str() == value; }); }
    static void appendUtf8(std::string& out, unsigned cp) {
        if (cp < 0x80) out += static_cast<char>(cp);
        else if (cp < 0x800) { out += static_cast<char>(0xc0 | (cp >> 6)); out += static_cast<char>(0x80 | (cp & 63)); }
        else if (cp < 0x10000) { out += static_cast<char>(0xe0 | (cp >> 12)); out += static_cast<char>(0x80 | ((cp >> 6) & 63)); out += static_cast<char>(0x80 | (cp & 63)); }
        else { out += static_cast<char>(0xf0 | (cp >> 18)); out += static_cast<char>(0x80 | ((cp >> 12) & 63)); out += static_cast<char>(0x80 | ((cp >> 6) & 63)); out += static_cast<char>(0x80 | (cp & 63)); }
    }
    struct Parser {
        const std::string& source; std::size_t pos = 0; int depth = 0;
        void space() { while (pos < source.size() && std::isspace(static_cast<unsigned char>(source[pos]))) ++pos; }
        char take() { if (pos >= source.size()) throw std::runtime_error("Unexpected end of JSON"); return source[pos++]; }
        unsigned hex4() { unsigned cp = 0; for (int i = 0; i < 4; ++i) { char h = take(); cp <<= 4; if (h >= '0' && h <= '9') cp += h - '0'; else if (h >= 'a' && h <= 'f') cp += h - 'a' + 10; else if (h >= 'A' && h <= 'F') cp += h - 'A' + 10; else throw std::runtime_error("Invalid Unicode escape"); } return cp; }
        std::string text() {
            if (take() != '"') throw std::runtime_error("Expected string");
            std::string out;
            for (;;) { char c = take(); if (c == '"') break; if (c == '\\') { c = take();
                switch (c) { case 'n': out += '\n'; break; case 'r': out += '\r'; break; case 't': out += '\t'; break; case 'b': out += '\b'; break; case 'f': out += '\f'; break;
                    case 'u': { unsigned cp = hex4(); if (cp >= 0xd800 && cp <= 0xdbff) { if (take() != '\\' || take() != 'u') throw std::runtime_error("Missing Unicode surrogate"); unsigned lo = hex4(); if (lo < 0xdc00 || lo > 0xdfff) throw std::runtime_error("Invalid Unicode surrogate"); cp = 0x10000 + ((cp - 0xd800) << 10) + lo - 0xdc00; } Json::appendUtf8(out, cp); break; }
                    case '\\': case '"': case '/': out += c; break; default: throw std::runtime_error("Invalid JSON escape"); }
                } else out += c;
            } return out;
        }
        Json value() {
            space(); if (++depth > 80) throw std::runtime_error("JSON too deep");
            Json result; char c = pos < source.size() ? source[pos] : '\0';
            if (c == '{') { ++pos; result = Json::obj(); space(); if (source.at(pos) == '}') ++pos; else for (;;) { space(); std::string key = text(); space(); if (take() != ':') throw std::runtime_error("Expected colon"); result.object[key] = value(); space(); char sep = take(); if (sep == '}') break; if (sep != ',') throw std::runtime_error("Expected comma"); } }
            else if (c == '[') { ++pos; result = Json::arr(); space(); if (source.at(pos) == ']') ++pos; else for (;;) { result.array.push_back(value()); space(); char sep = take(); if (sep == ']') break; if (sep != ',') throw std::runtime_error("Expected comma"); } }
            else if (c == '"') result = Json(text());
            else if (c == 't' && source.substr(pos, 4) == "true") { pos += 4; result = Json(true); }
            else if (c == 'f' && source.substr(pos, 5) == "false") { pos += 5; result = Json(false); }
            else if (c == 'n' && source.substr(pos, 4) == "null") pos += 4;
            else { std::size_t end = pos; while (end < source.size() && (std::isdigit(static_cast<unsigned char>(source[end])) || source[end] == '-' || source[end] == '+' || source[end] == '.' || source[end] == 'e' || source[end] == 'E')) ++end; if (end == pos) throw std::runtime_error("Invalid JSON value"); result = Json(std::stod(source.substr(pos, end - pos))); pos = end; }
            --depth; return result;
        }
    };
    static Json parse(const std::string& s) { Parser parser{s}; Json result = parser.value(); parser.space(); if (parser.pos != s.size()) throw std::runtime_error("Trailing JSON data"); return result; }
    static std::string quote(const std::string& s) { std::string out = "\""; const char* digits = "0123456789abcdef"; for (unsigned char c : s) { if (c == '"' || c == '\\') { out += '\\'; out += static_cast<char>(c); } else if (c < 32) { out += "\\u00"; out += digits[c >> 4]; out += digits[c & 15]; } else out += static_cast<char>(c); } return out + '"'; }
    std::string dump() const {
        switch (type) {
            case Null: return "null";
            case Number: { std::ostringstream out; out.precision(15); out << number; return out.str(); }
            case Boolean: return boolean ? "true" : "false";
            case String: return quote(string);
            case Array: { std::string out = "["; for (std::size_t i = 0; i < array.size(); ++i) { if (i) out += ','; out += array[i].dump(); } return out + ']'; }
            case Object: { std::string out = "{"; bool first = true; for (const auto& entry : object) { if (!first) out += ','; first = false; out += quote(entry.first) + ':' + entry.second.dump(); } return out + '}'; }
        } return "null";
    }
};

struct Strategy {
    double science = 1, culture = 1, growth = 1, commerce = 1, industry = 1, faith = .6, aggression = .4, naval = .2;
    int maxCities = 5;
    std::vector<std::string> techPriority, civicPriority;
};
inline const Json& entity(const Json& values, int id) { for (const auto& v : values.array) if (v["id"].integer(-1) == id) return v; static const Json empty; return empty; }
inline double noise(int turn, int unit, int tile) { std::uint32_t x = static_cast<std::uint32_t>(turn * 1237 + unit * 4153 + tile * 2099); x ^= x >> 16; x *= 0x7feb352d; x ^= x >> 15; return (x % 1000) / 1000.0; }
inline double priority(const std::vector<std::string>& list, const std::string& item) { auto it = std::find(list.begin(), list.end(), item); return it == list.end() ? 0 : 28 - std::distance(list.begin(), it) * .75; }

using ScoreAdjustment = std::function<double(const Json&, const Json&, double)>;
inline Json decide(const Json& obs, const Strategy& base, ScoreAdjustment adjust = {}) {
    Strategy cfg = base;
    const auto& plan = obs["player"]["plan"]; const auto& weights = plan["weights"];
    const bool directed = !plan["strategy"].isNull() && plan["strategy"].str() != "adaptive";
    auto adapted = [&](double existing, const char* key) { return weights[key].isNull() ? existing : existing * (directed ? .2 : .4) + weights[key].num() * (directed ? .9 : .7); };
    cfg.science = adapted(cfg.science, "science"); cfg.culture = adapted(cfg.culture, "culture"); cfg.growth = adapted(cfg.growth, "growth");
    cfg.commerce = adapted(cfg.commerce, "commerce"); cfg.industry = adapted(cfg.industry, "industry"); cfg.faith = adapted(cfg.faith, "faith");
    cfg.aggression = adapted(cfg.aggression, "aggression"); cfg.naval = adapted(cfg.naval, "naval");
    if (!plan["maxCities"].isNull()) cfg.maxCities = plan["maxCities"].integer();
    const int worldWidth = obs["world"]["width"].integer(); const bool wraps = obs["world"]["wrapX"].flag() && worldWidth > 0;
    const auto& player = obs["player"];
    Json objectives = Json::obj();
    const bool tracing = std::getenv("CIV_AI_TRACE") && std::string(std::getenv("CIV_AI_TRACE")) == "1";
    Json traceGroups = Json::arr(); int tracedUnits = 0, omittedGroups = 0;
    auto traceAction = [](Json action) { action.object.erase("hint"); action.object.erase("health"); action.object.erase("distance"); return action; };
    auto baseKind = [](const Json& unit) { const auto base = unit["baseItem"].str(); return base.empty() ? unit["type"].str() : base; };
    const int turn = obs["turn"].integer(), cities = static_cast<int>(obs["cities"].array.size());
    int military = 0, captureUnits = 0, landMilitary = 0, landCaptureUnits = 0, siegeUnits = 0; std::map<std::string, int> counts;
    double readyMilitary = 0;
    std::map<int, const Json*> tiles;
    std::map<std::pair<int, int>, int> coordinates;
    std::map<int, int> positions;
    std::set<int> peaceful, reservedCaptures; std::map<int, double> allocatedDamage, allocatedCityDamage;
    std::set<int> reservedDistricts, reservedNuclearCells;
    for (const auto& cell : player["pendingNuclearCells"].array) reservedNuclearCells.insert(cell.integer());
    std::vector<int> reservedCities;
    for (const auto& t : obs["tiles"].array) { tiles[t["id"].integer()] = &t; coordinates[{t["q"].integer(), t["r"].integer()}] = t["id"].integer(); }
    std::set<std::pair<int, int>> fortZones;
    for (const auto& t : obs["tiles"].array) if (t["fort"]["owner"].integer(-1) == player["id"].integer() && t["fort"]["hp"].num() > 0) {
        for (int dy = -1; dy <= 1; ++dy) for (int dx = -1; dx <= 1; ++dx) {
            int col = t["col"].integer() + dx;
            if (wraps) col = (col + worldWidth) % worldWidth;
            fortZones.insert({col, t["row"].integer() + dy});
        }
    }
    for (const auto& u : obs["units"].array) positions[u["id"].integer()] = u["tile"].integer();
    double goldBudget = std::max(0.0, player["gold"].num() - player["committedGold"].num());
    const auto& finance = player["finance"];
    double projectedUpkeep = finance["projectedUpkeep"].num();
    const double grossGold = finance["grossGold"].num(player["yields"]["gold"].num() + projectedUpkeep), arrears = finance["arrears"].num();
    const double domesticGold = std::min(grossGold, finance["domesticGold"].num(grossGold));
    std::map<int, double> cityUpkeep;
    for (const auto& city : finance["cityCommitments"].array) cityUpkeep[city["id"].integer()] = city["upkeep"].num();
    double faithBudget = std::max(0.0, player["faith"].num() - player["committedFaith"].num());
    int faithRecruitments = 0;
    int routeBudget = obs["player"]["tradeCapacity"].integer(1) - obs["player"]["tradeRoutes"].integer();
    auto medical = [](const std::string& kind) { return kind == "herbalist" || kind == "surgeon" || kind == "fieldmedic" || kind == "ambulance"; };
    auto religious = [&](const std::string& kind) { return kind == "missionary" || kind == "apostle" || kind == "inquisitor" || kind == "guru"; };
    auto civilian = [&](const std::string& kind) { return medical(kind) || kind == "archaeologist" || kind == "naturalist" || kind == "rockband" || kind == "militaryengineer" || kind == "batteringram" || kind == "siegetower" || kind == "balloon" || kind == "observationdrone" || kind == "settler" || kind == "builder" || religious(kind) || kind == "envoy" || kind == "great_person" || kind == "great_admiral"; };
    auto hexDistance = [&](int first, int second) {
        if (!tiles.count(first) || !tiles.count(second)) return 100;
        const auto& a = *tiles.at(first); const auto& b = *tiles.at(second);
        auto distance = [&](int shift) { return (std::abs(a["q"].integer() - b["q"].integer() - shift) + std::abs(a["r"].integer() - b["r"].integer()) + std::abs(a["q"].integer() + a["r"].integer() - b["q"].integer() - b["r"].integer() - shift)) / 2; };
        return wraps ? std::min({distance(0), distance(worldWidth), distance(-worldWidth)}) : distance(0);
    };
    auto movementValid = [&](const Json& action) {
        const int id = action["unit"].integer(), dest = action["tile"].integer();
        const auto& unit = entity(obs["units"], id);
        // Engine actions already validate costs, traits, borders and terrain.
        // Recheck only reservations changed by earlier orders in this response.
        auto free = [&](int tile) {
            for (const auto& other : obs["units"].array) {
                const int otherId = other["id"].integer();
                if (otherId != id && otherId != unit["linkedUnit"].integer(-1) && positions.count(otherId) && positions[otherId] == tile) return false;
            }
            return true;
        };
        if (!free(dest)) return false;
        for (const auto& step : action["hint"]["transit"].array) if (step.integer() != positions[id] && !free(step.integer())) return false;
        return true;
    };
    for (const auto& u : obs["units"].array) { std::string kind = baseKind(u); counts[kind]++; if (!civilian(kind)) { military++; readyMilitary += u["hp"].num(100) / u["maxHp"].num(100); } if (u["canCapture"].flag()) captureUnits++; if (u["domain"].str() == "land") { if (!civilian(kind)) landMilitary++; if (u["canCapture"].flag()) landCaptureUnits++; } if (u["siege"].flag()) siegeUnits++; }
    for (const auto& city : obs["cities"].array) { for (const auto& building : city["buildings"].array) if (building.str() == "missilesilo") counts["missilesilo"]++; const auto item = city["productionBaseItem"].str(city["production"]["item"].str()); if (!item.empty()) counts[item]++; if (city["productionMilitary"].flag()) military++; if (city["productionCapture"].flag()) captureUnits++; if (city["productionDomain"].str() == "land") { if (city["productionMilitary"].flag()) landMilitary++; if (city["productionCapture"].flag()) landCaptureUnits++; } if (city["productionSiege"].flag()) siegeUnits++; }
    auto reserveRole = [&](const std::string& kind, const std::string& domain, bool siege, bool armed) { return armed && domain == "land" && !siege && kind != "scout" && kind != "antiair" && kind != "sam"; };
    double reserveDefenders = 0;
    int reserveAdmissions = 0;
    for (const auto& u : obs["units"].array) if (reserveRole(u["type"].str(), u["domain"].str(), u["siege"].flag(), !civilian(u["type"].str())) && u["transport"].isNull()) reserveDefenders += u["hp"].num(100) / u["maxHp"].num(100);
    for (const auto& city : obs["cities"].array) if (reserveRole(city["production"]["item"].str(), city["productionDomain"].str(), city["productionSiege"].flag(), city["productionMilitary"].flag())) reserveDefenders++;
    int supplyWorkers = 0;
    std::map<int, std::string> supplyCommitments;
    for (const auto& unit : obs["units"].array) if (unit["type"].str() == "builder") supplyWorkers++;
    const auto& commitments = finance.contains("cityCommitments") ? finance["cityCommitments"] : obs["cities"];
    for (const auto& city : commitments.array) { const auto item = finance.contains("cityCommitments") ? city["item"].str() : city["production"]["item"].str(); supplyCommitments[city["id"].integer()] = item; if (item == "builder") supplyWorkers++; }
    const double temperature = plan["campaign"]["temperature"].num(.5);
    bool walledTargets = false; for (const auto& other : obs["opponents"].array) if (other["relation"]["status"].str() == "war") for (const auto& city : other["cities"].array) if (city["walls"].num() > 0) walledTargets = true;
    int medicalCount = counts["herbalist"] + counts["surgeon"] + counts["fieldmedic"] + counts["ambulance"];
    std::set<int> assignedPatients, orderedUnits;
    std::set<std::string> reservedResourceTypes;
    bool war = false; for (const auto& other : obs["opponents"].array) if (other["alive"].flag() && other["relation"]["status"].str() == "war") war = true;
    Json orders = Json::arr();
    int desiredMilitary = static_cast<int>(cities * (1.8 + (plan["goal"].str() == "domination" ? .6 : 0)) + 2 + (war ? std::ceil(cities * .3) : 0));
    for (const auto& action : obs["legalActions"].array) if (action["type"].str() == "produce" && !action["hint"]["militaryTarget"].isNull()) { desiredMilitary = action["hint"]["militaryTarget"].integer(); break; }
    const int desiredNavy = counts["aircraftcarrier"] > 0 ? 6 : std::min(6, std::max(2, (cities + 3) / 4 + (cfg.naval > 1.2 ? 1 : 0)));
    auto navyCount = [&]() { return counts["quadrireme"] + counts["caravel"] + counts["privateer"] + counts["ironclad"] + counts["galley"] + counts["frigate"] + counts["destroyer"] + counts["battleship"] + counts["assaultship"] + counts["missilecruiser"] + counts["submarine"] + counts["nuclearsubmarine"] + counts["aircraftcarrier"]; };
    const int desiredAircraft = std::min(3, std::max(1, (cities + 9) / 10));
    int nuclearBudget = player["nuclearStockpile"].integer() - player["committedNukes"].integer();
    const int desiredAirDefense = desiredAircraft;
    int forwardAirports = 0;
    for (const auto& action : obs["legalActions"].array) if (action["type"].str() == "produce" && !action["hint"]["airInfrastructurePending"].isNull()) { forwardAirports = action["hint"]["airInfrastructurePending"].integer(); break; }
    int spaceCommitments = 0;
    int spaceProjects = 0;
    std::set<int> captureRecruitments;
    for (const auto& city : obs["cities"].array) { bool built = false; for (const auto& district : city["districts"].array) if (district["item"].str() == "spaceport") built = true; if (built || city["production"]["item"].str() == "spaceport") spaceCommitments++; }
    for (const auto& city : obs["cities"].array) { const auto item = city["production"]["item"].str(); if (item == "satellite" || item == "moon" || item == "colony") spaceProjects++; }
    std::map<std::string, std::vector<Json>> groups;
    for (const auto& action : obs["legalActions"].array) {
        std::string type = action["type"].str(), group = type;
        if (action.contains("unit")) group = (medical(entity(obs["units"], action["unit"].integer())["type"].str()) ? "medical:" : "unit:") + std::to_string(action["unit"].integer());
        else if (type == "government" || type == "policies") group = "constitution";
        else if (type == "appointGovernor" || type == "promoteGovernor" || type == "assignGovernor") group = "governors";
        else if (type == "recruitSpy" || type == "spyMission") group = "espionage";
        else if (type == "sendCityEnvoy" || type == "levyCityState") group = "citystates";
        else if (type == "friendship" || type == "delegation" || type == "embassy" || type == "typedAlliance" || type == "tradeDeal" || type == "demand" || type == "denounce") group = "court";
        else if (type == "voteCongress") group = "congress:" + action["topic"].str();
        else if (type == "produce" || type == "purchase" || type == "recruitFaith") group = "city:" + std::to_string(action["city"].integer());
        else if (type == "trade") group = "trade:" + std::to_string(action["city"].integer());
        else if (type == "cityAttack" || type == "nuke") group = "attack:" + std::to_string(action["city"].integer());
        else if (type == "war" || type == "peace" || type == "alliance" || type == "openBorders" || type == "sendEnvoy" || type == "closeBorders" || type == "endAlliance") group = "diplomacy";
        groups[group].push_back(action);
    }
    // Frontline and diplomatic passage cannot be starved by idle unit IDs.
    using ActionGroup = std::pair<const std::string, std::vector<Json>>;
    std::vector<std::pair<double, const ActionGroup*>> rankedGroups;
    std::set<int> workingBuilders;
    for (const auto& unit : obs["units"].array) if (unit["type"].str() == "builder") workingBuilders.insert(unit["id"].integer());
    auto urgencyFor = [&workingBuilders](const Json& a) {
        const auto& h = a["hint"]; const std::string type = a["type"].str() == "jump" ? "move" : a["type"].str(); double urgency = 0;
        if (type == "produce" && h["defenseUrgency"].num() > 0) urgency = std::max(urgency, 2400.0);
        if (type == "move" && !h["captureCity"].isNull() || h["captureNow"].flag()) urgency = std::max(urgency, 2600.0);
        if (h["landingCapturer"].flag()) urgency = std::max(urgency, 2300.0);
        if (h["trafficYield"].flag() || h["blockedEvacuation"].flag()) urgency = std::max(urgency, 2800.0);
        if (type == "heal") urgency = std::max(urgency, 2200.0);
        if (type == "attack") urgency = std::max(urgency, 1800 + h["expectedDamage"].num());
        if (type == "move" && h["defenseDuty"].flag() && h["homeDefenseProgress"].num() > 0) urgency = std::max(urgency, 2350.0);
        if (type == "move" && h["localCombat"].flag() && h["routeProgress"].num() > 0) urgency = std::max(urgency, 2000.0);
        if (type == "move" && h["currentIncomingDamage"].num() >= 10 && h["incomingDamage"].num() < h["currentIncomingDamage"].num() * .65) urgency = std::max(urgency, 2450.0);
        if (h["captureProgress"].num() > 0 || h["siegeProgress"].num() > 0 || h["envoyProgress"].num() > 0 || h["envoyPassage"].flag()) urgency = std::max(urgency, 1300.0);
        if (workingBuilders.count(a["unit"].integer(-1)) && (h["improvable"].flag() || h["improveProgress"].num() > 0 || type == "improve" || type == "chop" || type == "repair" || type == "buildFort" || type == "buildRoad")) urgency = std::max(urgency, 1450.0);
        if (workingBuilders.count(a["unit"].integer(-1)) && h["strategicResource"].flag() && (h["strategicProgress"].num() > 0 || type == "improve" || type == "chop" || type == "repair")) urgency = std::max(urgency, 2050.0);
        if (!a.contains("unit")) urgency = std::max(urgency, 600.0);
        if (type == "research" || type == "civic" || type == "government" || type == "policies") urgency = std::max(urgency, 900.0);
        return urgency;
    };
    for (const auto& group : groups) {
        double urgency = 0;
        for (const auto& a : group.second) urgency = std::max(urgency, urgencyFor(a));
        rankedGroups.push_back({urgency, &group});
    }
    std::stable_sort(rankedGroups.begin(), rankedGroups.end(), [](const auto& a, const auto& b) { return a.first > b.first; });
    int nationalReserve = std::min(16, static_cast<int>(std::count_if(rankedGroups.begin(), rankedGroups.end(), [](const auto& group) { return !group.second->second.front().contains("unit"); })));
    for (const auto& rankedGroup : rankedGroups) {
        const auto& group = *rankedGroup.second;
        if (orders.array.size() >= 128) break;
        const bool unitGroup = group.second.front().contains("unit");
        if (!unitGroup && nationalReserve > 0) --nationalReserve;
        if (unitGroup && orders.array.size() >= static_cast<size_t>(128 - nationalReserve)) continue;
        // Only currently unreserved legal shots qualify. Keep wounded escapes and batch damage budgets.
        double readyShotScore = -1e9; int currentDanger = 0; bool favorableMelee = false;
        for (const auto& shot : group.second) {
            const auto& h = shot["hint"];
            if (shot["type"].str() == "attack" && !h["ranged"].flag() && !peaceful.count(shot["enemy"].integer(-1)) && h["expectedDamage"].num() >= h["retaliation"].num() * 1.2 && h["retaliation"].num() < entity(obs["units"], shot["unit"].integer())["hp"].num() * .5 && (!shot.contains("targetUnit") || allocatedDamage[shot["targetUnit"].integer()] < shot["health"].num(100) * .9)) favorableMelee = true;
            if (shot["type"].str() != "attack" || h["interception"].num() > 0 || h["consumable"].flag() && h["expectedDamage"].num() < 12 || !h["ranged"].flag() || h["retaliation"].num() > 0 || h["expectedDamage"].num() <= 0 || peaceful.count(shot["enemy"].integer(-1))) continue;
            if (shot.contains("targetUnit") && allocatedDamage[shot["targetUnit"].integer()] >= shot["health"].num(100) * .9) continue;
            if (shot.contains("targetCity") && allocatedCityDamage[shot["targetCity"].integer()] >= shot["health"].num()) continue;
            const auto& unit = entity(obs["units"], shot["unit"].integer());
            if (unit["hp"].num() < 45 && h["danger"].num() > 0) continue;
            readyShotScore = std::max(readyShotScore, 240 + std::min(60.0, h["expectedDamage"].num()) * .8);
            currentDanger = std::max(currentDanger, h["danger"].integer());
        }
        double bestScore = -1e9; Json best;
        const bool traceGroup = tracing && traceGroups.array.size() < 32 && (!unitGroup || tracedUnits < 16);
        Json candidates = Json::arr(), vetoes = Json::obj();
        auto veto = [&](const char* reason) { if (traceGroup) vetoes[reason] = vetoes[reason].integer() + 1; };
        const double goldBefore = goldBudget, upkeepBefore = projectedUpkeep;
        for (const auto& a : group.second) {
            const std::string type = a["type"].str() == "jump" ? "move" : a["type"].str(); const auto& h = a["hint"];
            const std::string item = h["baseItem"].str(a["item"].str());
            const double improvementValue = std::max(0.0, h["improvementValue"].num() - (reservedResourceTypes.count(h["resourceType"].str()) ? h["resourceFirstValue"].num() : 0));
            const bool captureNeeded = h["captureNeeded"].flag() && (!h.contains("captureTargets") || std::any_of(h["captureTargets"].array.begin(), h["captureTargets"].array.end(), [&](const Json& id) { return !captureRecruitments.count(id.integer()); }));
            // Another city's selected capturer already covers this interruption.
            if (type == "produce" && h["captureNeeded"].flag() && !captureNeeded && h["defenseUrgency"].num() == 0 && !entity(obs["cities"], a["city"].integer())["production"].isNull()) { veto("covered_capture"); continue; }
            if (type == "move" && !movementValid(a)) { veto("occupancy"); continue; }
            if (type == "found" && std::any_of(reservedCities.begin(), reservedCities.end(), [&](int tile) { return hexDistance(tile, positions[a["unit"].integer()]) < 4; })) { veto("settlement_spacing"); continue; }
            if (type == "trade" && routeBudget <= 0) { veto("trade_capacity"); continue; }
            if (type == "produce" && h["kind"].str() == "wonder" && counts[item] > 0) { veto("duplicate_wonder"); continue; }
            if (a.contains("unit") && (assignedPatients.count(a["unit"].integer()) || orderedUnits.count(a["unit"].integer()))) { veto("unit_already_assigned"); continue; }
            if (type == "heal" && (assignedPatients.count(a["targetUnit"].integer()) || orderedUnits.count(a["targetUnit"].integer()))) { veto("patient_already_assigned"); continue; }
            if ((type == "upgrade" || type == "government" || type == "policies" || type == "purchase") && h["goldCost"].num() > goldBudget) { veto("gold_budget"); continue; }
            if (type == "recruitFaith" && (faithRecruitments > 0 || h["faithCost"].num() > faithBudget)) { veto("faith_budget"); continue; }
            if (type == "attack" && (peaceful.count(a["enemy"].integer(-1)) || a.contains("targetUnit") && allocatedDamage[a["targetUnit"].integer()] >= a["health"].num(100) * .9)) { veto("damage_or_peace"); continue; }
            if (type == "attack" && a.contains("targetCity") && (reservedCaptures.count(a["targetCity"].integer()) && h["occupationEligible"].flag() || allocatedCityDamage[a["targetCity"].integer()] >= a["health"].num() && !h["occupationEligible"].flag())) { veto("city_damage_or_capture"); continue; }
            if (type == "move" && !h["captureCity"].isNull() && reservedCaptures.count(h["captureCity"].integer())) { veto("capture_reserved"); continue; }
            if (type == "produce" && a.contains("tile") && reservedDistricts.count(a["tile"].integer())) { veto("district_reserved"); continue; }
            double score = -100;
            if ((type == "move" || type == "rebase") && reservedNuclearCells.count(a["tile"].integer())) { veto("nuclear_destination"); continue; }
            if (type == "nuke" && std::any_of(h["footprint"].array.begin(), h["footprint"].array.end(), [&](const Json& cell) { return reservedNuclearCells.count(cell.integer()); })) { veto("nuclear_overlap"); continue; }
            if (type == "research" || type == "civic") {
                const double priorityCost = h.contains("baseCost") ? h["baseCost"].num() : h["cost"].num();
                const double effectiveCost = std::max(1.0, h["effectiveCost"].num(h["cost"].num(priorityCost)));
                const double completion = std::clamp(h["progress"].num() / effectiveCost, 0.0, 1.0);
                score = 30 - priorityCost * .035 + (h["boosted"].flag() ? 8 : 0) + completion * 45;
                score += h["strategicValue"].num();
                score += std::clamp(h["urgentValue"].num(), 0.0, 90.0);
                score += priority(type == "research" ? cfg.techPriority : cfg.civicPriority, item);
                if (item == player[type].str()) score += 35;
            } else if (type == "government" || type == "policies") score = h["netBenefit"].num() > 0 ? 35 + h["netBenefit"].num() : -100;
            else if (type == "voteCongress") score = 80;
            else if (type == "appointGovernor" || type == "promoteGovernor" || type == "assignGovernor" || type == "sendCityEnvoy" || type == "levyCityState" || type == "recruitSpy" || type == "spyMission" || type == "friendship" || type == "delegation" || type == "embassy" || type == "typedAlliance" || type == "tradeDeal" || type == "demand" || type == "denounce" || type == "plunderTrade" || type == "attackCityState") score = h["goldCost"].num() <= goldBudget ? h["utility"].num(-100) : -100;
            else if (type == "leaderAbility") score = cities ? h["utility"].num(120) : -100;
            else if (type == "religion") { score = 20; if (item == "wisdom") score += cfg.science * 10; if (item == "art") score += cfg.culture * 10; if (item == "harvest") score += cfg.growth * 10; if (item == "industry") score += cfg.industry * 10; }
            else if (type == "trade") score = 50 + (h["foreign"].flag() ? cfg.commerce * 10 : cfg.growth * 10);
            else if (type == "nuke") score = nuclearBudget > 0 && !h["neutral"].flag() && h["friendlyUnits"].num() == 0 && h["friendlyCities"].num() == 0 && h["friendlyFacilities"].num() == 0 && h["interception"].num() == 0 && (h["enemyCityValue"].num() >= 140 || h["enemyUnits"].num() >= 3) ? 360 + h["enemyUnits"].num() * 15 : -1000;
            else if (type == "cityAttack") score = 100;
            else if (type == "war") {
                // One authoritative commitment model; retain the original hard solvency gate.
                const bool solvent = arrears <= .01 && (grossGold >= projectedUpkeep || goldBudget >= projectedUpkeep * 5);
                score = solvent && !war && h["warPlan"]["declare"].flag()
                    ? 380 + std::min(60.0, h["warPlan"]["value"].num()) : -150;
            }
            else if (type == "peace") score = (cfg.aggression < .7 && h["duration"].num() > 25) || h["ourPower"].num() < h["theirPower"].num() * .6 ? 30 : -100;
            else if (type == "alliance") score = h["discontent"].num() < 30 && !war ? 35 - h["discontent"].num() : -100;
            else if (type == "openBorders") score = !war && h["discontent"].num() < 45 ? 18 - h["discontent"].num() * .25 : -100;
            else if (type == "closeBorders") score = h["militaryPressure"].num() > 12 ? 40 : -100;
            else if (type == "endAlliance") score = h["discontent"].num() >= 80 ? 100 : -100;
            else if (type == "sendEnvoy") {
                if (h["jointWar"].flag()) {
                    const double reserve = std::max(40.0, projectedUpkeep * 3 + arrears);
                    score = h["needAid"].flag() && h["helperEstimate"].num() >= 35 && h["warWeariness"].num() < 40 && arrears <= .01 && goldBudget - h["goldCost"].num() >= reserve ? 70 + std::min(70.0, h["aidPriority"].num()) : -100;
                } else score = h["ourPower"].num() < h["theirPower"].num() * .85 || h["warWeariness"].num() > 12 ? 60 : h["duration"].num() >= 8 && h["ourPower"].num() > h["theirPower"].num() * 1.6 ? 30 : -100;
            }
            else if (type == "voteAid") score = a["choice"].str() == h["choice"].str() ? 160 : -100;
            else if (type == "acceptDiplomacy" || type == "rejectDiplomacy") score = -100; // Diplomatic settlement evaluates domestic conditions in the authoritative engine.
            else if (type == "purchase") {
                const double reserve = std::max({100.0, cities * 25.0, projectedUpkeep * 3 + arrears});
                score = goldBudget - h["goldCost"].num() >= reserve && h["remaining"].num() >= 3 ? 110 + h["defenseUrgency"].num() * 80 + (war && h["military"].flag() ? 45 : 0) : -100;
                if (h["defenseUrgency"].num() > 0 && !h["military"].flag()) score = -100;
                if (item == "builder" && counts[item] >= std::max(1, cities)) score = -100;
                if (item == "settler" && (counts[item] > 1 || cities >= cfg.maxCities)) score = -100;
                if (h["unit"].flag() && civilian(item) && item != "builder" && item != "settler" && counts[item] >= 1) score = -100;
                if (h["military"].flag() && h["defenseUrgency"].num() == 0 && readyMilitary >= desiredMilitary) score = -100;
            }
            else if (type == "recruitFaith") {
                const int priests = counts["missionary"] + counts["apostle"] + counts["inquisitor"];
                const int desired = std::min(8, std::max(2, cities + 1));
                score = priests < desired && !war && (cfg.faith > 1.2 || player["plan"]["goal"].str() == "religion") ? 135 + cfg.faith * 8 + (item == "apostle" ? 18 : 0) : -100;
                if (item == "guru") score = priests >= 2 && counts[item] < 1 ? 125 : -150;
                if (h["faithOnly"].flag()) score = item == "warriormonk" ? military < desiredMilitary && war ? 140 : -150 : player["plan"]["goal"].str() == "culture" && counts[item] < 1 ? 155 : -150;
                if (item == "inquisitor") score = h["converted"].integer() < h["cities"].integer() && counts[item] < 1 ? 160 : -100;
                if (h["defenseUrgency"].num() > 0 || h["religionOwner"].integer(player["id"].integer()) != player["id"].integer()) score = -100;
            }
            else if (type == "produce") {
                const auto& city = entity(obs["cities"], a["city"].integer());
                // A reserves forward air infrastructure before generic district scoring.
                // A second airport must wait until existing and pending capacity is useful.
                if (item == "airport" && h["airBaseNeeded"].flag() &&
                    (!war || !h["airfield"].flag() || h["airTargets"].num() <= 0 ||
                     forwardAirports >= desiredAircraft - counts["bomber"] - counts["stealthbomber"] - counts["drone"])) continue;
                score = 5 - h["turns"].num() * .4;
                if (item == "settler") score += cities < cfg.maxCities && counts["settler"] == 0 && turn > 6 ? 140 * cfg.growth - cities * 9 : -200;
                else if (item == "builder") { int improvements = 0; for (const auto& t : obs["tiles"].array) if (t["owner"].integer(-1) == player["id"].integer() && !t["improvement"].isNull()) improvements++; score += counts["builder"] < std::max(1, cities / 2) && improvements < cities * 5 ? 75 + cfg.growth * 20 : -100; }
                else if (item == "scout" || item == "skirmisher" || item == "ranger" || item == "specops") score += counts["scout"] + counts["skirmisher"] + counts["ranger"] + counts["specops"] < 2 ? 90 : -250;
                else if (h["specialty"].flag()) { const int support = counts["batteringram"] + counts["siegetower"] + counts["balloon"] + counts["observationdrone"]; score += item == "archaeologist" ? (h["knownRuins"].num() > 0 && counts[item] < 1 ? 150 : -300) : item == "militaryengineer" ? (war && counts[item] < 1 ? 100 : -300) : war && military >= 3 && support < std::min(3, std::max(1, siegeUnits)) ? 130 : -300; }
                else if (h["medical"].flag()) score += medicalCount < std::min(4, std::max(1, (military + 4) / 5)) && (war || h["wounded"].num() > 0 || military >= 5) ? 160 + h["medicalTier"].num() * .6 : -180;
                else if (religious(item)) score += (cfg.faith > 1.2 || player["plan"]["goal"].str() == "religion") && counts["missionary"] + counts["apostle"] + counts["inquisitor"] < 4 ? 95 : -140;
                else if (h["kind"].str() == "unit") {
                    bool sea = h["domain"].str() == "sea";
                    double strength = std::max(h["strength"].num(), h["ranged"].num());
                    if (h["domain"].str() == "air") {
                        // A few useful aircraft supplement ground armies without sharing their siege quota.
                        const bool fighter = h["airOnly"].flag();
                        const bool airShortage = war && (fighter ? (h["airThreat"].flag() || h["carrierSlots"].num() > 0) && counts["fighter"] + counts["jetfighter"] + counts["stealthfighter"] < desiredAirDefense : h["airTargets"].num() > 0 && counts["bomber"] + counts["stealthbomber"] + counts["drone"] < desiredAircraft);
                        score += airShortage ? 220 + strength * .12 : -250;
                        if (h["carrierSlots"].num() > 0 && item != "drone" && airShortage) score += 80;
                        if ((item == "bomber" || item == "stealthbomber") && std::any_of(group.second.begin(), group.second.end(), [](const Json& choice) { return choice["type"].str() == "produce" && choice["item"].str() == "drone" && choice["hint"]["airTargets"].num() > 0; })) score -= 10;
                    } else {
                    const bool defenseShortage = h["antiAir"].flag() && h["airThreat"].flag() && counts["antiair"] + counts["sam"] < desiredAirDefense;
                    const bool shortage = military < desiredMilitary;
                    if (h["airOnly"].flag()) { score += defenseShortage ? 240 : -300; }
                    else {
                    score += shortage ? 24 + cfg.aggression * 28 + strength * .4 + (war ? 50 : 0) : -250;
                    if (sea) {
                        // Count existing, pending and same-response hulls. Only a reachable mission justifies a fleet.
                        const int navy = navyCount(), subs = counts["submarine"] + counts["nuclearsubmarine"];
                        const bool carrierPlan = h["carrier"].flag() && h["carrierAirReady"].flag() && navy >= 2 && counts["aircraftcarrier"] == 0;
                        const bool mission = war && h["navalTargets"].num() > 0 && (navy < desiredNavy || carrierPlan);
                        score = mission ? 155 + strength * .3 + cfg.naval * 8 - h["turns"].num() * .6 : -400;
                        if (h["submarine"].flag()) {
                            if (subs >= std::max(1, desiredNavy / 3)) score -= 450;
                            else if (mission && navy - subs > 0) score += 85;
                        }
                        if (mission && (counts["aircraftcarrier"] > 0 || h["carrier"].flag())) {
                            if (h["carrier"].flag()) score += carrierPlan ? 240 : -600;
                            if ((item == "battleship" || item == "missilecruiser") && counts["battleship"] + counts["missilecruiser"] == 0) score += 120;
                            if ((item == "destroyer" || item == "assaultship") && counts["destroyer"] + counts["assaultship"] == 0) score += 120;
                        }
                        if (mission && h["submarine"].flag() && h["submarineThreat"].flag()) score += 130;
                        if (mission && h["submarineThreat"].flag() && !h["submarine"].flag() && subs == 0 && !h["carrier"].flag()) score -= 180;
                    }
                    if (shortage && war && h["canCapture"].flag() && (sea ? captureUnits < std::max(2, military / 3) : landCaptureUnits < std::max(2, landMilitary / 3))) score += sea ? 45 : 110;
                    if (war && !sea && h["ranged"].num() > 0 && landCaptureUnits == 0) score -= 45;
                    if (shortage && h["wallMatch"].flag() && war) score += 45;
                    if (h["siege"].flag()) score += shortage && war && walledTargets && siegeUnits < std::max(1, military / 4) ? 80 : -15;
                    if (item == "archer" || item == "crossbow" || item == "cannon") score += counts[item] < military / 3 + 1 ? 12 : -12;
                    // Fund a small guard before war. Remove this preference as soon as
                    // existing, pending and same-response defenders cover the reserve.
                    if (!war && reserveRole(item, h["domain"].str(), h["siege"].flag(), h["military"].flag()) && reserveDefenders < h["reserveTarget"].num() - .01 && (h["regionalRisk"].num() < .5 || reserveAdmissions < 2)) {
                        score = std::max(score, 260 + h["preparation"].num() * 20 + (h["canCapture"].flag() && landCaptureUnits < std::max(1, h["reserveTarget"].integer() / 2) ? 15 : 0) - h["turns"].num() * 1.5);
                        if (h["regionalRisk"].num() >= .5) score = std::max(score, 430 + h["regionalRisk"].num() * 160 + std::min(30.0, strength * .3) - h["turns"].num() * .8 - h["upkeep"].num() * 1.5);
                    }
                    }
                    }
                } else if (item == "atomicbomb") score += war && h["nuclearLaunchers"].num() > 0 && player["nuclearStockpile"].integer() + counts["atomicbomb"] < 2 ? 120 : -250;
                else if (item == "missilesilo") score += war && counts["missilesilo"] == 0 && player["resources"]["uranium"].num() > 0 ? 90 : -200;
                else if (item == "monument") score += 60 + cfg.culture * 15 + (city["loyalty"].num(100) < 60 ? 55 : 0);
                else if (item == "dam" || item == "floodbarrier" || item == "reservoir" || item == "hydroplant" || item == "windplant" || item == "solarplant" || item == "carbonrecapture" || item == "coalplant" || item == "oilplant" || item == "powerplant") {
                    const bool legacyPower = !obs["climate"]["enabled"].flag() && (item == "coalplant" || item == "oilplant" || item == "powerplant");
                    score += legacyPower ? 60 + cfg.industry * 25 : h["climateUtility"].num() + cfg.industry * 8;
                }
                else if (item == "granary") score += 38 + cfg.growth * 13 + (h["housing"].num() <= h["population"].num() + 1 ? 35 : 0);
                else if (item == "airport" && war && h["airfield"].flag() && h["airBaseNeeded"].flag() && h["airTargets"].num() > 0 && forwardAirports < desiredAircraft - counts["bomber"] - counts["stealthbomber"] - counts["drone"]) score += 170;
                else if (item == "medievalwalls" || item == "renaissancewalls" || item == "steelwalls") score += war ? 110 : 15;
                else if (item == "walls") score += war ? 130 : cfg.aggression * 10 + 5;
                else if (item == "barracks") score += war ? 110 : 25 + cfg.aggression * 24;
                else if (item == "campus") score += 45 + cfg.science * 25 + h["adjacency"].num() * 4;
                else if (item == "holy") score += 20 + cfg.faith * 28 + h["adjacency"].num() * 4;
                else if (item == "theater") score += 25 + cfg.culture * 30 + h["adjacency"].num() * 4;
                else if (item == "industrial") score += 30 + cfg.industry * 28 + h["adjacency"].num() * 4;
                else if (item == "commercial") score += 20 + cfg.commerce * 25 + h["adjacency"].num() * 4;
                else if (item == "harbor") score += 30 + cfg.naval * 28 + h["adjacency"].num() * 4;
                else if (item == "aqueduct") score += h["housing"].num() <= h["population"].num() + 1 ? 110 : -10;
                else if (item == "spaceport") {
                    score += spaceCommitments < h["spaceLimit"].integer(1) && h["spaceRank"].integer(99) < h["spaceLimit"].integer(1) ? (h["scienceGoal"].flag() ? 140 : 45) * cfg.science : -450;
                }
                else if (item == "satellite" || item == "moon" || item == "colony") score += spaceProjects == 0 ? (h["scienceGoal"].flag() ? 180 : 85) * cfg.science : -450;
                else if (item == "airport") score += cfg.culture * 50;
                else if (item == "library" || item == "university" || item == "lab" || item == "nuclear") score += 40 + cfg.science * 25;
                else if (item == "shrine" || item == "temple") score += 35 + cfg.faith * 25;
                else if (item == "amphitheater" || item == "museum" || item == "opera" || item == "broadcast") score += 40 + cfg.culture * 25;
                else if (item == "workshop" || item == "factory") score += 60 + cfg.industry * 25;
                else if (item == "market" || item == "bank" || item == "exchange") score += 35 + cfg.commerce * 25;
                else if (item == "lighthouse" || item == "shipyard" || item == "seaport") score += 40 + cfg.naval * 20;
                else if (h["kind"].str() == "wonder") score += 35 + cfg.culture * 20 + cfg.industry * 10 + h["wonderUtility"].num();
                else if (item == "research") score += cfg.science * 22;
                else if (item == "festival") score += cfg.culture * 22;
                else if (item == "prayer") score += cfg.faith * 15;
                score -= h["obsolete"].flag() ? 200 : 0;
                if (city["population"].integer() <= 2 && item == "granary") score += 10;
            } else if (a.contains("unit")) {
                const auto& unit = entity(obs["units"], a["unit"].integer()); const std::string kind = baseKind(unit);
                if (type == "recallEnvoy") score = h["blockedEvacuation"].flag() ? 800 : -100;
                else if (type == "found") score = h["first"].flag() ? 1000 : h["settlement"].num() + 45;
                else if (type == "trainVeteran") {
                    score = h["danger"].flag() ? -200 : 170;
                    if (item == "assault") score += h["ranged"].flag() || h["siege"].flag() ? 25 : cfg.aggression * 12;
                    if (item == "bastion") score += h["homeDefense"].flag() ? 40 : 8;
                    if (item == "terrain") score += h["terrain"].flag() ? 35 : kind == "scout" ? 30 : 10;
                    if (item == "medicine") score += (100 - h["health"].num(100)) * .65;
                }
                else if (type == "repair") score = 230 + improvementValue;
                else if (type == "pillage") score = 145 + (h["resource"].flag() ? 20 : 0);
                else if (type == "destroyFort") score = 165;
                else if (type == "destroyRoad") score = 120;
                else if (type == "buildFort") score = h["resource"].flag() ? -100 : h["danger"].flag() ? (h["frontier"].flag() ? 245 : 215) : cities > 1 && h["used"].num() < cities ? 100 : -100;
                else if (type == "buildRoad") score = 25;
                else if (type == "improve") score = 200 + (h.contains("improvementValue") ? improvementValue : h["resource"].flag() ? 30 : 0);
                else if (type == "chop") score = h["requiresClear"].flag() && unit["charges"].integer() >= 2 ? 190 + improvementValue : h["unblocksImprovement"].flag() ? 65 + cfg.industry * 5 : -50;
                else if (type == "spread") score = 200;
                else if (type == "nuke") score = nuclearBudget > 0 && !h["neutral"].flag() && h["friendlyUnits"].num() == 0 && h["friendlyCities"].num() == 0 && h["friendlyFacilities"].num() == 0 && h["interception"].num() == 0 && (h["enemyCityValue"].num() >= 140 || h["enemyUnits"].num() >= 3) ? 360 + h["enemyUnits"].num() * 15 : -1000;
                else if (type == "patrol") score = h["currentlyPatrolling"].flag() ? -100 : h["airThreat"].flag() ? 320 : h["capital"].flag() ? 120 : 80;
                else if (type == "cancelPatrol") score = -1000;
                else if (type == "attack") {
                    score = 70 + cfg.aggression * 15 + h["expectedDamage"].num(27) * .9 - h["retaliation"].num() * .8;
                    if (h["expectedDamage"].num() >= a["health"].num(100)) score += 35;
                    if (h["retaliation"].num() >= unit["hp"].num() * (.68 + temperature * .3)) score -= 140;
                    if (unit["hp"].num() < 25 && !h["ranged"].flag()) score -= 160;
                    score -= h["interception"].num() * 3;
                    if (h["consumable"].flag() && h["expectedDamage"].num() < 12) score -= 240;
                    if (a.contains("targetCity") && h["walls"].num() > 0 && !h["siege"].flag()) score -= 90;
                    if (a.contains("targetCity") && h["wallMultiplier"].num() > 1) score += 20;
                    if (a.contains("targetCity") && h["siege"].flag()) score += h["walls"].num() > 0 ? 50 : 20;
                    if (a.contains("targetCity")) {
                        score += temperature * 32;
                        if (h["captureNow"].flag()) score = 420;
                        else if (h["occupationEligible"].flag() && h["expectedDamage"].num() >= a["health"].num() && h["retaliation"].num() < unit["hp"].num() * .85) score += 180;
                        if (h["ranged"].flag() && h["supportCapturers"].num() > 0) score += 25;
                    }
                }
                else if (type == "excavate" || type == "establishPark" || type == "concert" || type == "religiousHeal") score = 230 + h["healing"].num() * 3;
                else if (type == "heal") score = 190 + h["healing"].num() * 3 + (h["health"].num() < 35 ? 60 : 0) - h["danger"].num() * 100;
                else if (type == "rebase") score = h["baseLost"].flag() ? 400 : h["carrierDeck"].flag() ? 260 + h["airProgress"].num() * 20 : h["airProgress"].num() > 0 ? 95 + h["airProgress"].num() * 20 : -25;
                else if (type == "upgrade") {
                    const double reserve = std::max(war || h["defenseDuty"].flag() ? 35.0 : 90.0, (projectedUpkeep + std::max(0.0, h["upkeepDelta"].num())) * 3 + arrears);
                    score = goldBudget - h["goldCost"].num() >= reserve ?
                        115 + h["strengthGain"].num() * 2 + h["healingGain"].num() * 2 + (h["wallMatch"].flag() ? 55 : 0) + (h["defenseDuty"].flag() ? 25 : 0) : -100;
                    if (h["oldWallMatch"].flag() && !h["wallMatch"].flag()) score -= 150;
                    if (h["danger"].flag() && unit["hp"].num() < 45) score -= 180;
                }
                else if (type == "fortify") { const double health = unit["hp"].num() * 100 / unit["maxHp"].num(100); score = health < 70 ? 100 + (100 - health) : -5; if (health < 30) score += 80; if (h["siegeStation"].flag() && health >= 70) score = 85; }
                else if (type == "move") {
                    score = h["exploration"].num() * 2.2 + (h["ruin"].flag() ? 60 : 0) + noise(turn, unit["id"].integer(), a["tile"].integer()) * 5;
                    if (kind == "settler") {
                        const double progress = h["settleProgress"].num();
                        const double distance = h["settleDistance"].num(999);
                        // Route progress remains valuable on a long sea voyage;
                        // absolute distance must not make every move lose to rest.
                        score = h.contains("settleProgress") ?
                            (distance < 900 ? 45 + progress * 45 - std::min(distance, 30.0) * .6 : -100) :
                            90 - distance * 1.5;
                        if (progress <= 0 && h.contains("settleProgress")) score -= 70;
                        score += h["exploration"].num() * (h["settleExploring"].flag() ? 2.5 : 1) + h["settlement"].num() * .08;
                        score -= h["danger"].num() * 250 + h["rangedThreat"].num() * 100;
                    }
                    else if (kind == "envoy") score = h["envoyDistance"].num(999) < 900 ? 600 - h["envoyDistance"].num() * 10 + h["envoyProgress"].num() * 40 : -100;
                    else if (kind == "builder") {
                        const double distance = h["improveDistance"].num(999), progress = h["improveProgress"].num();
                        score = h["improvable"].flag() ? 130 : distance < 900 && progress > 0 ? 45 + progress * 40 - std::min(distance, 30.0) * .6 : -100;
                        if (h.contains("improvementValue") && distance < 900 && progress > 0) score = std::max(score, 190 + improvementValue * .9 + std::min(3.0, progress) * 15 - std::min(distance, 30.0) * .6);
                        score -= h["danger"].num() * 250 + h["rangedThreat"].num() * 100;
                    }
                    else if (h["specialty"].flag()) score = h["specialtyDistance"].num(999) < 900 && h["specialtyProgress"].num() > 0 ? 95 + h["specialtyProgress"].num()*30 - std::min(30.0,h["specialtyDistance"].num()) - h["danger"].num()*220 : -100;
                    else if (medical(kind)) score = h["patientDistance"].num(50) < 40 ? 100 - h["patientDistance"].num() * 13 + h["patientProgress"].num() * 18 - h["danger"].num() * 220 - h["rangedThreat"].num() * 100 : -25 - h["danger"].num() * 220;
                    else if (religious(kind)) score = h["religionDistance"].num(999) < 900 ? 55 + h["religionProgress"].num() * 38 - std::min(30.0, h["religionDistance"].num()) - h["danger"].num() * 180 : -100;
                    else if (kind == "scout") score -= h["danger"].num() * 35;
                    else { if (h["enemyDistance"].num() < 40) score += 70 - h["enemyDistance"].num() * 7 + cfg.aggression * 4; score += h["defenseBonus"].num() * (unit["hp"].num() < 65 ? 4 : 1.5); score -= h["rangedThreat"].num() * (unit["hp"].num() < 65 ? 22 : 7); if (unit["hp"].num() < 60) score -= 70; if (h["camp"].flag()) score += 60; }
                    if (!civilian(kind) && h["siegeDistance"].num(999) < 900 && !h["defenseDuty"].flag()) {
                        if (h["siegeProgress"].num() > 0) score += 60 + temperature * 55 + h["siegeProgress"].num() * 35;
                        else score -= 45;
                        if (h["firingPosition"].flag() && h["siegeProgress"].num() > 0) score += unit["siege"].flag() && h["siegeWalls"].num() > 0 ? 70 : 35;
                    }
                    if (!civilian(kind) && h["defenseDuty"].flag() && h["homeDefenseProgress"].num() > 0) score += 130 + h["homeDefenseProgress"].num() * 30;
                    if (!civilian(kind) && h["routeProgress"].num() > 0 && h["enemyDistance"].num(50) < 8) score += 25 + h["routeProgress"].num() * 18;
                    if (unit["domain"].str() == "sea" && h["routeProgress"].num() > 0) score = std::max(score, 160 + h["routeProgress"].num() * 25 - h["incomingDamage"].num() * .5);
                    if (!h["captureCity"].isNull()) score = 430;
                    const auto memoryKey = std::to_string(unit["id"].integer());
                    const auto& memory = obs["memory"]["lastTiles"]; if (memory[memoryKey].integer(-1) == a["tile"].integer()) score -= 24;
                    for (const auto& visit : obs["memory"]["visits"][memoryKey].array) if (visit.integer(-1) == a["tile"].integer()) score -= kind == "envoy" ? 12 : 22;
                    if (h["envoyPassage"].flag()) score = 500 - h["danger"].num() * 90 - h["rangedThreat"].num() * 35;
                }
            }
            if (type == "produce") score -= h["placementLoss"].num() * 4 + h["siteRisk"].num() * .5;
            const double primaryScore = score;
            // Unified diplomatic intent and personality hints.
            if (type == "sendEnvoy" && !h["jointWar"].flag() && h.contains("peaceIntent") && !h["peaceIntent"].isNull()) score = h["peaceIntent"].flag() ? 320 : -100;
            if (h.contains("opinion") && !h["opinion"].isNull()) {
                const double opinion = h["opinion"].num();
                if (type == "alliance") score = opinion >= 40 && !war ? 60 + opinion * .3 : -100;
                else if (type == "openBorders") score = opinion >= 10 && !war ? 30 : -100;
                else if (type == "closeBorders") score = opinion <= -30 ? 45 : -100;
                else if (type == "endAlliance") score = opinion <= -20 ? 100 : -100;
            }
            if (type == "produce" && h.contains("unitPreference")) score += (h["unitPreference"].num(1) - 1) * 80;
            const double strategicScore = score;
            if (adjust) { Json scoring = a; if (h.contains("baseItem")) scoring["item"] = h["baseItem"]; score = adjust(obs, scoring, score); }
            const double driverScore = score;
            if (type == "produce") {
                const bool defender = h["military"].flag() && h["domain"].str() == "land" && !h["airOnly"].flag() && item != "scout";
                if (defender) score += 155 * h["recruitment"].num() - (h["siege"].flag() ? 45 * h["recruitment"].num() : 0) + h["fortressBonus"].num() * .18;
                else score -= 110 * h["recruitment"].num();
            }
            if ((type == "government" || type == "policies") && h["netBenefit"].num() <= 0) score = -100;
            // Survival takes precedence over leader-specific economic preferences.
            if (type == "produce" && h["defenseUrgency"].num() > 0) {
                const bool defender = h["military"].flag() && h["domain"].str() == "land" && item != "scout";
                if (defender) score += 430 * h["defenseUrgency"].num() + std::max(h["strength"].num(), h["ranged"].num()) * .7 - h["turns"].num() * 16 - (h["siege"].flag() ? 160 : 0);
                else score -= 650 * h["defenseUrgency"].num();
                if (defender && h["frontlineNeeded"].flag() && h["canCapture"].flag()) score += 110;
                if (defender && std::max(h["strength"].num(), h["ranged"].num()) < h["minDefenseStrength"].num() && std::any_of(group.second.begin(), group.second.end(), [&](const Json& choice) { return choice["hint"]["military"].flag() && choice["hint"]["domain"].str() == "land" && std::max(choice["hint"]["strength"].num(), choice["hint"]["ranged"].num()) >= h["minDefenseStrength"].num(); })) score -= 280;
            }
            if (a.contains("unit")) {
                const auto& unit = entity(obs["units"], a["unit"].integer());
                const bool assault = unit["canCapture"].flag() && unit["domain"].str() == "land" && !unit["ranged"].flag() && !unit["embarked"].flag();
                const double incoming = h["currentIncomingDamage"].num(), exposed = h["incomingDamage"].num();
                // A favorable engagement beats peacetime maintenance; walls alone do not forbid armor combat.
                if (assault && type == "attack" && h["expectedDamage"].num() >= h["retaliation"].num() * 1.2 && h["retaliation"].num() < unit["hp"].num() * .5) score = std::max(score, 250 + h["expectedDamage"].num() * .6 - h["retaliation"].num() * .3);
                if (assault && type == "move" && (h["localCombat"].flag() && h["routeProgress"].num() > 0 || h["defenseDuty"].flag() && h["homeDefenseProgress"].num() > 0)) score = std::max(score, 240 + std::min(80.0, std::max(h["routeProgress"].num(), h["homeDefenseProgress"].num()) * 25) - exposed * .6);
                // Formation is a bounded positioning preference; take a favorable ready attack first.
                if (type == "move" && !civilian(unit["type"].str()) && unit["domain"].str() != "air" && !favorableMelee && readyShotScore <= 0 && (h["localCombat"].flag() || h["flankingGain"].num() > 0) && exposed < unit["hp"].num() * .7)
                    score += std::clamp(h["flankingGain"].num() * 3 + h["supportGain"].num() * 2, -18.0, 24.0);
                // Survive visible ranged/city fire when no favorable counterattack is available.
                const bool emergencyRetreat = !h["homeTerritory"].flag() || unit["hp"].num() < 45 || incoming >= unit["hp"].num() * .9;
                if (assault && type == "move" && emergencyRetreat && incoming >= 10 && exposed < incoming * .65 && (!favorableMelee || incoming >= unit["hp"].num() * .9)) score = std::max(score, 350 + std::min(100.0, incoming - exposed));
                if (assault && type == "move" && exposed >= unit["hp"].num() * .9 && exposed > incoming && h["captureCity"].isNull()) score -= 220;
                if ((type == "fortify" || type == "trainVeteran" || type == "upgrade" || type == "buildFort") && incoming > (h["homeTerritory"].flag() && type == "fortify" ? 18 : 10)) score -= 220;
            }
            if (a.contains("unit") && readyShotScore > 0) {
                const auto& unit = entity(obs["units"], a["unit"].integer());
                const bool safeShot = type == "attack" && h["ranged"].flag() && h["retaliation"].num() == 0 && h["interception"].num() == 0 && h["expectedDamage"].num() > (h["consumable"].flag() ? 12 : 0);
                const bool escape = type == "move" && unit["hp"].num() < 45 && (h["danger"].num() < currentDanger || h["incomingDamage"].num() < h["currentIncomingDamage"].num() * .65);
                if (safeShot) score = std::max(score, 240 + std::min(60.0, h["expectedDamage"].num()) * .8);
                else if (!escape && type != "nuke" && type != "patrol") score = std::min(score, readyShotScore - 1);
            }
            // City centers shield garrisons; preserve the defender and value real captures.
            if (a.contains("unit")) {
                const auto& actor = entity(obs["units"], a["unit"].integer());
                if (h["civilianCapture"].flag()) score = std::max(score, 340.0 - h["danger"].num() * 45);
                if (type == "move" && !h["captureCivilian"].str().empty()) score = std::max(score, 340.0 - h["danger"].num() * 65);
                if (actor["garrisonThreat"].flag() && type == "fortify") score = std::max(score, 205.0);
                if (actor["garrisonThreat"].flag() && (type == "move" || type == "separate") && h["captureCity"].isNull()) score -= 220;
                if ((actor["type"].str() == "settler" || actor["type"].str() == "builder") && type == "move" && currentDanger > 0 && h["danger"].num() < currentDanger) score = std::max(score, 420.0 - h["danger"].num() * 180 - h["rangedThreat"].num() * 80);
            }
            if (type == "move" && h["carrierAwaitingAircraft"].flag() && h["incomingDamage"].num() <= 0) score -= 400;
            if (type == "move" && h["fleetProgress"].num() > 0 && h["fleetDistance"].num() >= 3 && readyShotScore <= 0 && h["incomingDamage"].num() < entity(obs["units"], a["unit"].integer())["hp"].num() * .6) score += std::min(120.0, 60.0 + h["fleetProgress"].num() * 15);
            if (type == "move" && h["airDefenseDuty"].flag() && h["homeDefenseProgress"].num() > 0) score = std::max(score, 260 + h["homeDefenseProgress"].num() * 20 - h["danger"].num() * 40);
            if (type == "move" && h["captureProgress"].num() > 0 && !h["defenseDuty"].flag()) score = std::max(score, 270 + h["captureProgress"].num() * 30 - h["danger"].num() * 45);
            if (type == "produce" && captureNeeded && h["defenseUrgency"].num() == 0) {
                const bool capturer = h["canCapture"].flag() && h["domain"].str() == "land" && item != "scout";
                if (capturer) score += 650 + h["strength"].num() * .7 - h["turns"].num() * 12;
                else score -= 650;
            }
            if (type == "move" && h["landingCapturer"].flag() && h["siegeProgress"].num() > 0) score = std::max(score, 500 + h["siegeProgress"].num() * 30);
            if (type == "move" && h["trafficYield"].flag()) score = 650 + (h["yieldWater"].flag() ? 35 : 0) - h["danger"].num() * 10;
            if (type == "fortify" && entity(obs["units"], a["unit"].integer())["hp"].num() >= entity(obs["units"], a["unit"].integer())["maxHp"].num(100) && entity(obs["units"], a["unit"].integer())["fortified"].flag()) score = -100;
            // A treasury pays several future payrolls; same-response queues reserve their running costs.
            // Missing researched supplies override saturated ordinary improvement quotas.
            if (type == "produce" && item == "builder" && h["resourceWorkerTarget"].integer() > 0 && h["resourceDistance"].num(999) < 900 && h["defenseUrgency"].num() == 0 && !h["captureNeeded"].flag() && supplyWorkers < h["resourceWorkerTarget"].integer() && !std::any_of(group.second.begin(), group.second.end(), [](const Json& choice) { const auto item = choice["item"].str(); return choice["type"].str() == "produce" && (item == "satellite" || item == "moon" || item == "colony"); })) score = std::max(score, 650.0 - std::min(40.0, h["resourceDistance"].num()) * 2 - h["turns"].num() * 2);
            // One reachable economic worker can recover food or a missing amenity type.
            if (type == "produce" && item == "builder" && supplyWorkers < h["economicWorkerTarget"].integer() && h["economicDistance"].num(999) < 900 && h["defenseUrgency"].num() == 0 && !h["captureNeeded"].flag() && !std::any_of(group.second.begin(), group.second.end(), [](const Json& choice) { const auto item = choice["item"].str(); return choice["type"].str() == "produce" && (item == "satellite" || item == "moon" || item == "colony"); })) score = std::max(score, (h["economicFoodNeed"].flag() ? 650.0 : 460.0) - std::min(40.0, h["economicDistance"].num()) * 2 - h["turns"].num() * 2);
            // Preserve revealed fuel and ore after leader and tactical preferences.
            if (type == "produce" && h["strategicDeposit"].flag()) score -= 800;
            if (a.contains("unit") && entity(obs["units"], a["unit"].integer())["type"].str() == "builder" && h["strategicResource"].flag()) {
                if (type == "improve" || type == "repair" || type == "chop") score += 180;
                if (type == "move" && h["strategicProgress"].num() > 0) score += 280;
            }
            if (type == "move" && a.contains("unit")) {
                const auto& actor = entity(obs["units"], a["unit"].integer());
                const double weather = h["currentHazardDamage"].num();
                if (civilian(actor["type"].str()) && weather > 0 && weather >= actor["hp"].num() * .5 && h["hazardDamage"].num() < weather * .5 && h["incomingDamage"].num() < h["currentIncomingDamage"].num() && h["incomingDamage"].num() < actor["hp"].num())
                    score = std::max(score, 430 + std::min(60.0, weather - h["hazardDamage"].num()));
            }
            // Weather exposure can make repairing in place fatal even when the repair is valuable.
            if (a.contains("unit") && (type == "improve" || type == "repair" || type == "chop" || type == "buildFort" || type == "buildRoad")) {
                const double weather = h["currentHazardDamage"].num();
                score -= weather * 6;
                if (weather >= entity(obs["units"], a["unit"].integer())["hp"].num() && weather > 0) score = -1000;
            }
            if (type == "move") score -= h["hazardDamage"].num() * 5;
            const double tacticalScore = score;
            if ((type == "produce" || type == "upgrade" || type == "purchase" || type == "recruitFaith") && finance.contains("projectedUpkeep")) {
                const double delta = type == "produce" ? h["upkeep"].num() - cityUpkeep[a["city"].integer()] : type == "purchase" || type == "recruitFaith" ? h["upkeep"].num() : h["upkeepDelta"].num();
                const double bill = std::max(0.0, projectedUpkeep + delta), deficit = std::max(0.0, bill - grossGold);
                const bool emergency = type == "produce" && h["military"].flag() && h["domain"].str() == "land" && !h["airOnly"].flag() && h["defenseUrgency"].num() > 0;
                // Legacy debt must not block affordable defense after income recovers.
                // Temporary incoming compensation cannot fund this narrow exception.
                const bool debtDefense = emergency && h["defenseUrgency"].num() >= 2 && !h["siege"].flag() && bill <= domesticGold - std::max(5.0, domesticGold * .2);
                if (delta > 0 && (arrears > .01 && !debtDefense || deficit > 0 && goldBudget < bill * 3 + deficit * (emergency ? 2 : 8))) score = -1000;
                // Reserve admission remains strict; funded missions keep a bounded cost penalty.
                else if (delta > 0 && deficit > 0) score -= std::min(emergency ? 80.0 : 180.0, delta * 10);
                if (type == "produce" && (arrears > .01 || grossGold < projectedUpkeep && goldBudget < projectedUpkeep * 5)) {
                    if (item == "commercial" || item == "market" || item == "bank" || item == "stock" || item == "harbor") score += 220;
                }
            }
            if (type == "purchase" && arrears > .01 || type == "war" && (arrears > .01 || grossGold < projectedUpkeep && goldBudget < projectedUpkeep * 5)) score = -1000;
            if (traceGroup) {
                if (score <= -1000) veto("finance_or_safety");
                candidates.array.push_back(Json::obj({{"action", traceAction(a)}, {"score", score}, {"components", Json::obj({{"primary", primaryScore}, {"strategy", strategicScore-primaryScore}, {"driver", driverScore-strategicScore}, {"tactical", tacticalScore-driverScore}, {"finance", score-tacticalScore}})}}));
                std::stable_sort(candidates.array.begin(), candidates.array.end(), [](const Json& a, const Json& b) { return a["score"].num() > b["score"].num(); });
                if (candidates.array.size() > 3) candidates.array.pop_back();
            }
            if (score > bestScore) { bestScore = score; best = a; }
        }
        if (!best.isNull() && bestScore > -30) {
            if (best["type"].str() == "produce") { const int city = best["city"].integer(); projectedUpkeep += best["hint"]["upkeep"].num() - cityUpkeep[city]; cityUpkeep[city] = best["hint"]["upkeep"].num(); supplyWorkers += (best["item"].str() == "builder") - (supplyCommitments[city] == "builder"); supplyCommitments[city] = best["item"].str(); }
            if (best["type"].str() == "upgrade") projectedUpkeep += std::max(0.0, best["hint"]["upkeepDelta"].num());
            // Replacing an existing queue removes its old national commitment first.
            if (best["type"].str() == "produce") {
                const auto& city = entity(obs["cities"], best["city"].integer());
                const auto previous = city["productionBaseItem"].str(city["production"]["item"].str());
                if (!previous.empty()) {
                    counts[previous]--;
                    if (city["productionMilitary"].flag()) military--;
                    if (city["productionCapture"].flag()) captureUnits--;
                    if (city["productionDomain"].str() == "land") { if (city["productionMilitary"].flag()) landMilitary--; if (city["productionCapture"].flag()) landCaptureUnits--; }
                    if (city["productionSiege"].flag()) siegeUnits--;
                    if (reserveRole(previous, city["productionDomain"].str(), city["productionSiege"].flag(), city["productionMilitary"].flag())) reserveDefenders--;
                    if (medical(previous)) medicalCount--;
                    if (previous == "spaceport") spaceCommitments--;
                    if (previous == "satellite" || previous == "moon" || previous == "colony") spaceProjects--;
                }
            }
            const bool militaryProduction = best["type"].str() == "produce" && best["hint"]["military"].flag();
            const double bestDamage = best["hint"]["expectedDamage"].num(27);
            const Json& selected = best;
            const auto bestCountItem = selected["hint"]["baseItem"].str(selected["item"].str());
            if (best.contains("unit") && best["type"].str() == "move" && best["hint"]["siegeCity"].integer(-1) >= 0 && !best["hint"]["defenseDuty"].flag()) objectives[std::to_string(best["unit"].integer())] = Json::obj({{"city", best["hint"]["siegeCity"]}, {"until", turn + 3}});
            const bool captureProduction = militaryProduction && best["hint"]["canCapture"].flag(), siegeProduction = militaryProduction && best["hint"]["siege"].flag();
            if (militaryProduction && reserveRole(bestCountItem, best["hint"]["domain"].str(), siegeProduction, true)) { reserveDefenders++; reserveAdmissions++; }
            if (best["type"].str() == "produce" && best["item"].str() == "airport" && best["hint"]["airTargets"].num() > 0) forwardAirports++;
            if (captureProduction && best["hint"]["domain"].str() == "land") for (const auto& id : best["hint"]["captureTargets"].array) captureRecruitments.insert(id.integer());
            if (best["type"].str() == "attack" && best.contains("targetCity")) {
                allocatedCityDamage[best["targetCity"].integer()] += bestDamage;
                if (best["hint"]["occupationEligible"].flag() && bestDamage >= best["health"].num()) reservedCaptures.insert(best["targetCity"].integer());
            }
            if (best["type"].str() == "move" && !best["hint"]["captureCity"].isNull()) reservedCaptures.insert(best["hint"]["captureCity"].integer());
            if (best["type"].str() == "produce" && medical(best["item"].str())) medicalCount++;
            if (best["type"].str() == "nuke") { nuclearBudget--; for (const auto& cell : best["hint"]["footprint"].array) reservedNuclearCells.insert(cell.integer()); }
            if (best["type"].str() == "heal") assignedPatients.insert(best["targetUnit"].integer());
            if (best.contains("unit") && entity(obs["units"], best["unit"].integer())["type"].str() == "builder" && (best["type"].str() == "improve" || best["type"].str() == "repair" || best["type"].str() == "chop" || best["type"].str() == "move" && best["hint"]["improveProgress"].num() > 0) && !best["hint"]["resourceType"].str().empty()) reservedResourceTypes.insert(best["hint"]["resourceType"].str());
            if (captureProduction) captureUnits++; if (militaryProduction && best["hint"]["domain"].str() == "land") { landMilitary++; if (captureProduction) landCaptureUnits++; } if (siegeProduction) siegeUnits++;
            // Purchases reserve all resulting roles before later cities are evaluated.
            if (best["type"].str() == "purchase" && best["hint"]["unit"].flag()) {
                const auto& h = best["hint"]; counts[bestCountItem]++; projectedUpkeep += h["upkeep"].num();
                if (h["military"].flag()) { military++; readyMilitary++; }
                if (h["canCapture"].flag()) captureUnits++;
                if (h["domain"].str() == "land") { if (h["military"].flag()) landMilitary++; if (h["canCapture"].flag()) landCaptureUnits++; }
                if (h["siege"].flag()) siegeUnits++;
                if (reserveRole(bestCountItem, h["domain"].str(), h["siege"].flag(), h["military"].flag())) reserveDefenders++;
                if (medical(bestCountItem)) medicalCount++;
                if (bestCountItem == "builder") supplyWorkers++;
            }
            best["priority"] = urgencyFor(best);
            if (best["type"].str() == "recruitSpy" || best["type"].str() == "levyCityState") goldBudget -= best["hint"]["goldCost"].num();
            if (best["type"].str() == "sendEnvoy") goldBudget -= best["hint"]["goldCost"].num(10);
            best.object.erase("hint"); if (best["type"].str() != "sendEnvoy") best.object.erase("enemy"); best.object.erase("health"); best.object.erase("distance");
            orders.array.push_back(best);
            if (best["type"].str() == "government" || best["type"].str() == "policies") { const auto it = std::find_if(group.second.begin(), group.second.end(), [&](const Json& a) { return a["type"].str() == best["type"].str() && a["item"].str() == best["item"].str(); }); if (it != group.second.end()) goldBudget -= (*it)["hint"]["goldCost"].num(); }
            if (best.contains("unit")) orderedUnits.insert(best["unit"].integer());
            if (best["type"].str() == "trade") routeBudget--;
            if (best["type"].str() == "peace") peaceful.insert(best["player"].integer());
            if (best["type"].str() == "attack" && best.contains("targetUnit")) allocatedDamage[best["targetUnit"].integer()] += bestDamage;
            if (best["type"].str() == "move" || best["type"].str() == "jump" || best["type"].str() == "rebase") { const int id = best["unit"].integer(), partner = entity(obs["units"], id)["linkedUnit"].integer(-1); if (positions.count(partner) && positions[partner] == positions[id]) { positions[partner] = best["tile"].integer(); orderedUnits.insert(partner); } positions[id] = best["tile"].integer(); }
            if (best["type"].str() == "found") { reservedCities.push_back(positions[best["unit"].integer()]); positions.erase(best["unit"].integer()); }
            if (best["type"].str() == "upgrade" || best["type"].str() == "purchase") { const auto it = std::find_if(group.second.begin(), group.second.end(), [&](const Json& a) { return a["type"].str() == best["type"].str() && a["item"].str() == best["item"].str(); }); if (it != group.second.end()) goldBudget -= (*it)["hint"]["goldCost"].num(); }
            if (best["type"].str() == "produce" && best.contains("tile")) reservedDistricts.insert(best["tile"].integer());
            if (best["type"].str() == "recruitFaith") { faithRecruitments++; const auto it = std::find_if(group.second.begin(), group.second.end(), [&](const Json& a) { return a["type"].str() == "recruitFaith" && a["item"].str() == best["item"].str(); }); if (it != group.second.end()) faithBudget -= (*it)["hint"]["faithCost"].num(); counts[best["item"].str()]++; }
            if (best["type"].str() == "produce") { counts[bestCountItem]++; if (militaryProduction) military++; }
            if (best["type"].str() == "produce" && best["item"].str() == "spaceport") spaceCommitments++;
            if (best["type"].str() == "produce" && (best["item"].str() == "satellite" || best["item"].str() == "moon" || best["item"].str() == "colony")) spaceProjects++;
        }
        if (traceGroup) {
            traceGroups.array.push_back(Json::obj({{"group", group.first}, {"urgency", rankedGroup.first}, {"selected", bestScore > -30 ? traceAction(best) : Json()}, {"selectedScore", bestScore}, {"top", candidates}, {"vetoes", vetoes}, {"candidateCount", static_cast<int>(group.second.size())}, {"budgetBefore", Json::obj({{"gold", goldBefore}, {"upkeep", upkeepBefore}})}, {"budgetAfter", Json::obj({{"gold", goldBudget}, {"upkeep", projectedUpkeep}})}}));
            if (unitGroup) tracedUnits++;
        } else if (tracing) omittedGroups++;
    }
    Json lastTiles = Json::obj(), visits = Json::obj(); int tracked = 0;
    std::vector<const Json*> trackedUnits; for (const auto& unit : obs["units"].array) trackedUnits.push_back(&unit);
    std::stable_sort(trackedUnits.begin(), trackedUnits.end(), [&](const Json* a, const Json* b) { const int ar = (*a)["type"].str() == "envoy" ? 2 : orderedUnits.count((*a)["id"].integer()), br = (*b)["type"].str() == "envoy" ? 2 : orderedUnits.count((*b)["id"].integer()); return ar > br; });
    for (const auto* value : trackedUnits) { if (tracked++ >= 128) break; const auto& unit = *value; const auto key = std::to_string(unit["id"].integer()); lastTiles[key] = unit["tile"]; Json history = obs["memory"]["visits"][key]; if (history.type != Json::Array) history = Json::arr(); if (history.array.empty() || history.array.back().integer() != unit["tile"].integer()) history.array.push_back(unit["tile"]); while (history.array.size() > 6) history.array.erase(history.array.begin()); visits[key] = history; }
    Json memory = Json::obj({{"lastTiles", lastTiles}, {"visits", visits}, {"turn", turn}, {"goal", plan["goal"]}});
    { Json bounded = Json::obj(); for (const auto* unit : trackedUnits) { if (bounded.object.size() >= 128) break; const auto key = std::to_string((*unit)["id"].integer()); if (objectives.contains(key)) bounded[key] = objectives[key]; else if (obs["memory"]["objectives"][key]["until"].integer(-1) >= turn) bounded[key] = obs["memory"]["objectives"][key]; } memory["objectives"] = bounded; }
    Json result = Json::obj({{"orders", orders}, {"memory", memory}});
    if (tracing) result["diagnostics"] = Json::obj({{"version", 1}, {"turn", turn}, {"player", player["id"]}, {"goal", plan["goal"]}, {"groups", traceGroups}, {"omittedGroups", omittedGroups}});
    return result;
}
inline int run(const Strategy& cfg, ScoreAdjustment adjustment = {}) {
    if (std::getenv("CIV_DRIVER_STREAM")) {
        std::string line;
        while (std::getline(std::cin, line)) {
            try { std::cout << decide(Json::parse(line), cfg, adjustment).dump() << '\n' << std::flush; }
            catch (const std::exception& e) { std::cerr << e.what() << '\n'; return 1; }
        }
        return 0;
    }
    try { std::string input((std::istreambuf_iterator<char>(std::cin)), std::istreambuf_iterator<char>()); Json observation = Json::parse(input); std::cout << decide(observation, cfg, adjustment).dump() << '\n'; return 0; }
    catch (const std::exception& e) { std::cerr << e.what() << '\n'; std::cout << "{\"orders\":[],\"memory\":null}\n"; return 1; }
}
} // namespace civ
