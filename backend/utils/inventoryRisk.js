const Inventory = require ("../models/Inventory");
const SystemSettings = require("../models/SystemSettings");

async function getInventoryRiskPercentage(){
    const setting = await SystemSettings.findOne();
    return{
        highRiskPercentage: setting?. riskSettings?. highRiskPercentage??50,
        mediumRiskPercentage:setting?.riskSettings?.mediumRiskPercentage??100
    }
}

async function calculateInventoryRiskLevel(currentStock, reorderThreshold){
    const{highRiskPercentage, mediumRiskPercentage} = await getInventoryRiskPercentage();
    const stock = Number(currentStock);
    const threshold = Number(reorderThreshold);

    const stockPercentage = (stock/threshold)*100;

    if(stockPercentage <= highRiskPercentage){
        return"High";
    }

    if(stockPercentage <= mediumRiskPercentage){
        return "Medium"

    }

    return "Low";

}

async function refreshAllInventoryRiskLevels(){
    const items = await Inventory.find() 
    for (const item of items) {
        item.riskLevel = await calculateInventoryRiskLevel(item.currentStock, item.reorderThreshold);
        await item.save();
    }
}

module.exports ={
    getInventoryRiskPercentage,
    calculateInventoryRiskLevel,
    refreshAllInventoryRiskLevels
}