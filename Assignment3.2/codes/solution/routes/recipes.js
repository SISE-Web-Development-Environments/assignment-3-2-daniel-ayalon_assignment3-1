var express = require("express");
var router = express.Router();
const axios = require("axios");
const DButils = require("../../modules/DButils");
const api_domain = "https://api.spoonacular.com/recipes";
router.get('/randomRecipes', async (req, res, next) => {
  try {
    const search_random = await axios.get(`${api_domain}/random`, {
      params: {
        limitLicense: true,
        number: 3,
        apiKey: process.env.spooncular_apiKey
      }
    });
    let results = search_random.data.recipes;
    let i = 0;
    let info = [];
    while (i < results.length) {
      while (results[i].instructions === undefined) {
        results[i] = await axios.get(`${api_domain}/random`, {
          params: {
              number: 1,
              apiKey: process.env.spooncular_apiKey,
          }
         });
        results[i]=results[i].data.recipes;
      }
      let recipe = await getRecipe(results[i], req);
      info.push(recipe)
      i++;
    }
    res.status(200).send(info);
  }catch (error) {
    next(error)
  }
});
router.get("/recipepage/recipeID/:recipeID",async(req,res,next)=> {
  try {
    const get_recipe =await axios.get(`${api_domain}/${req.params.recipeID}/information`, {
      params: {
        id: req.params.recipeID,
        includeNutrition: false,
        apiKey: process.env.spooncular_apiKey
      }
    });
    if(get_recipe.length==0){
      res.status(204).send("There is no recipe with given recipID");
    }
    else{
      let relevant=relevantData(get_recipe);
      await addToWatchTable(req.params.recipeID,req);
      res.status(200).send(relevant);
    }
  } catch (error) {
    next(error)
  }

});
router.get("/search/query/:searchQuery/amount/:num", async (req, res) => {
  try {
    const {searchQuery, num} = req.params;
    let search_params = {};
    if (req.query["diet"]) {
      search_params["diet"] = req.query["diet"];
    }
    else if (req.query["cuisine"]) {
      search_params["cuisine"] = req.query["cuisine"];
    } else if (req.query["intolerance"]) {
      search_params["intolerance"] = req.query["intolerance"];
    }

    search_params.query = searchQuery;
    search_params.number = num;
    search_params.instructionsRequired = true;
    search_params.apiKey=process.env.spooncular_apiKey;

    let recipes = await searchForRecipes(search_params,req);
    if(recipes.length == 0){
      res.status(404).send({message: "there is no recipe that user want/no page like this"})
    }else{
      res.status(200).send(recipes);
    }
  } catch (error) {
    res.sendStatus(500);
  }
});
async function extractrelevantRecipeData(recipes_Info,req) {
  let  relevant_list=[];
  let i=0;
  while (i<recipes_Info.length){
    let recipe= await getRecipe(recipes_Info[i],req).then(result => {return result});
    relevant_list.push(recipe)
    i++;
  }
  return relevant_list;

}
async function getRecipe(recipe, req) {

  let id=req.session.user_id;
  if (id===undefined) {
    return {
      id: recipe.id,
      title: recipe.title,
      readyInMinutes: recipe.readyInMinutes,
      image: recipe.image,
      like: recipe.aggregateLikes,
      vegetarian: recipe.vegetarian,
      glutenFree: recipe.glutenFree,
      vegan: recipe.vegan,

    };
  } else if(id!==undefined) {
    let is_watched =await isUserWatched(recipe.id)
    let is_favourite =await isInFavourite(recipe.id)
    return {
      id: recipe.id,
      title: recipe.title,
      readyInMinutes: recipe.readyInMinutes,
      image: recipe.image,
      like: recipe.aggregateLikes,
      vegetarian: recipe.vegetarian,
      glutenFree: recipe.glutenFree,
      vegan: recipe.vegan,
      watched: is_watched,
      saved: is_favourite,
    };
  }

}
async function isInFavourite(id) {
  const isrecipeThere = await DButils.execQuery(`select recipe_id from favoritesRecipes where recipe_id='${id}' `);
  if (isrecipeThere.length == 0) {
    return false;
  } else {
    return true;
  }
}
async function isUserWatched(id) {
  const is_watched = await DButils.execQuery(`select recipe_id from watchedRecipes where recipe_id='${id}'`);
  if (is_watched.length == 0) {
    return false;
  } else {
    return true;
  }
}
async function searchForRecipes(searchParams,req) {
  try {
    const search_Response = await axios.get(`${api_domain}/search`, {
      params: {
        query: searchParams.query,
        number: searchParams.number,
        cuisine:searchParams["cuisine"] ,
        diet: searchParams["diet"],
        intolerance: searchParams["intolerance"],
        instructionsRequired: true,
        apiKey: process.env.spooncular_apiKey,
      }
     
    });
    let good_recipes= await check_instructions(search_Response,searchParams);
    const recipes_id_list = extractSearchResultsIds(search_Response,)
    let info_array = await getRecipesInfo(recipes_id_list,req);
    return info_array;
  }catch (error) {
    throw new Error();
  }
}
async function getRecipesInfo(recipes_id_list,req) {
  let promises = [];
  let i=0;
  while(i<recipes_id_list.length) {
    let id=recipes_id_list[i];
    let recpie = await axios.get(`${api_domain}/${id}/information` , {
      params:{
        apiKey:process.env.spooncular_apiKey,
      }

    });
    promises.push(recpie.data)
    i++;
  }
  let relevantRecipesData = extractrelevantRecipeData(promises,req);
  return relevantRecipesData;

}

async function check_instructions(recipes,searchParams){
  let i=0;
  let array_of_recipes=recipes.data.results;
  while(i<array_of_recipes.length){
       while (array_of_recipes[i].instructions === null){
           array_of_recipes[i] =await axios.get(`${api_domain}/search`, {
               params: {
                   query: searchParams.query,
                   number: 1,
                   cuisine:searchParams["cuisine"] ,
                   diet: searchParams["diet"],
                   intolerance: searchParams["intolerance"],
                   instructionsRequired: true,
                   apiKey: process.env.spooncular_apiKey,
               }

           });

           array_of_recipes.push(array_of_recipes[i]);
       }

      i++
   }
   recipes.data.results=array_of_recipes;
   return recipes;
}
async function addToWatchTable(recipID,req) {
  if(req.session.user_id) {
    const check_if_exist = await DButils.execQuery(`select recipe_id from watchedRecipes where recipe_id='${recipID}' and user_id='${req.session.user_id}' `);
    if (check_if_exist.length == 1) {
      await DButils.execQuery(`delete from watchedRecipes where recipe_id='${recipID}'`);
      await DButils.execQuery(`insert into watchedRecipes (recipe_id,user_id) values('${recipID}','${req.session.user_id}') `);
    } else {
      await DButils.execQuery(`insert into watchedRecipes (recipe_id,user_id) values('${recipID}','${req.session.user_id}')`);
    }
  }
}
function extractSearchResultsIds(search_Response){
  let recipes = search_Response.data.results;
  let recipes_id_list=[];
  recipes.map((recipe)=>{
    recipes_id_list.push(recipe.id);
  });
  return recipes_id_list;
}
//get information from the recipe
function getRecipeInfo(id) {
  return axios.get(`${api_domain}/${id}/information`, {
    params: {
      includeNutrition: false,
      apiKey: process.env.spooncular_apiKey
    }
  });
}
function relevantData(recipe) {
  const {extendedIngredients,analyzedInstructions} = recipe.data;
  let ingredients =[];
  let instructions =[];
  extendedIngredients.forEach(ingredient =>{
    const{name,amount,unit} = ingredient;
    ingredients.push({name:name,unit:unit,amount:amount});
  });
  if(analyzedInstructions.length>0) {
    analyzedInstructions[0].steps.forEach(instruction => {
      const {num, step} = instruction;
      instructions.push({num: num, step: step});
    });
  }
  if(instructions.length>0){
    return {
      id: recipe.data.id,
      title: recipe.data.title,
      readyInMinutes: recipe.data.readyInMinutes,
      image: recipe.data.image,
      like: recipe.data.aggregateLikes,
      vegetarian: recipe.data.vegetarian,
      glutenFree: recipe.data.glutenFree,
      vegan: recipe.data.vegan,
      extendedIngredients: ingredients,
      servings: recipe.data.servings,
      analyzedInstructions: instructions
    };
  }
  else{
    return {
      id: recipe.data.id,
      title: recipe.data.title,
      readyInMinutes: recipe.data.readyInMinutes,
      image: recipe.data.image,
      like: recipe.data.aggregateLikes,
      vegetarian: recipe.data.vegetarian,
      glutenFree: recipe.data.glutenFree,
      vegan: recipe.data.vegan,
      extendedIngredients: ingredients,
      servings: recipe.data.servings
    };
  }

}
exports.getRecipe=getRecipe;
exports.getRecipeInfo=getRecipeInfo;
exports.router=router;