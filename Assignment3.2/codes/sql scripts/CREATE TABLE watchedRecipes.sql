-- CREATE TABLE watchedRecipes(
--     [recipe_id][int] not null ,
--     [user_id][int] not null,
--     [timeAdded][DateTime] not null DEFAULT CURRENT_TIMESTAMP,
--     primary key (user_id,recipe_id),
--     FOREIGN KEY (user_id) REFERENCES users(user_id),
--
--
-- )
-- --
--
-- INSERT INTO watchedRecipes (recipe_id, user_id) VALUES (1,1);
INSERT INTO watchedRecipes (recipe_id, user_id) VALUES (2,2);

--
-- INSERT INTO watchedRecipes (recipe_id, username)
-- VALUES ('39334FE3-2109-4A96-882B-2AE68BD8B198','danik94');
--
-- INSERT INTO watchedRecipes (recipe_id, username)
-- VALUES ('41012FDA-99FC-4745-9358-579ED06B2E73','danik94');
--
-- INSERT INTO watchedRecipes (recipe_id, username)
-- VALUES ('C79F3FAC-C9D5-40FB-B5D0-C26CBBC75624','danik94');
--
-- INSERT INTO watchedRecipes (recipe_id, username)
-- VALUES ('256087DE-2EE1-4EA8-AF9F-C7E6E38C6874','danik94');