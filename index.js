const Scraper = require('@ulyssear/bootstrap-scraping');
const { url } = require('inspector');
const path = require('path');

(async function () {
  const scraper = new Scraper({
    directory: path.resolve(__dirname),
  });

  scraper.addTask({
    name: 'categories',
    url: 'https://retroachievements.org/',
    callable: async function (page) {
      const menus = await page.$x('/html/body/nav[1]/div/div/div/div/ul/li[1]/div/ul');
      const data = {};

      for (const menu of menus) {
        const entries = await menu.$x('./li');
        let current_category = null;
        for (const entry of entries) {
          const is_category = await entry.evaluate((node) => node.classList.contains('dropdown-header'));
          if (is_category) {
            current_category = await entry.evaluate((node) => node.innerText);
            data[current_category] = [];
            continue;
          }
          const name = await entry.evaluate((node) => {
            let {innerText} = node;
            // par
          });
          const url = await entry.evaluate((node) => node.querySelector('a')?.href);

          if (!(current_category && name && url)) {
            continue;
          }
          data[current_category].push({ name, url });
        }
      }

      for (const category in data) {
        for (const item of data[category]) {
          scraper.addTask({
            name: `${category}/${item.name}`,
            url: item.url.startsWith('/') ? `https://retroachievements.org${item.url}` : item.url,
            callable: async function (page) {
              const table = await page.$x('/html/body/div[3]/main/div/div/div/div[3]/table');
              const rows = await table[0]?.$x('./tbody/tr[position() > 1 and position() < last()]');
              const _data = [];
              if (rows) {
                for (const row of rows) {
                  const cells = await row.$x('./th|./td');

                  const title = await cells[1]?.evaluate((node) => encodeURIComponent(node.innerText));
                  const achievements = await cells[2]?.evaluate((node) => node.textContent);
                  const points = await cells[3]?.evaluate((node) => node.textContent);
                  const lastUpdated = await cells[4]?.evaluate((node) => node.textContent);
                  const leaderboards = await cells[5]?.evaluate((node) => node.textContent);

                  const url = await row.evaluate((node) => node.querySelector('a')?.getAttribute('href'));

                  const task_name = `${category}/${item.name}/${title}`;

                  scraper.addTask({
                    name: task_name,
                    url: url.startsWith('/') ? `https://retroachievements.org${url}` : url,
                    callable: async function (page) {
                      const __data = {};

                      const content = await page.$x('/html/body/div[3]/main/div/div[1]/div');

                      const game_name = await content[0]?.$x('./h3');
                      __data.name = await game_name[0]?.evaluate((node) => node.textContent);

                      await page.waitForXPath('/html/body/div[3]/main/div/div[2]/div[1]/img');
                      const cover = await page?.$x('/html/body/div[3]/main/div/div[2]/div[1]/img');
                      __data.cover = await cover[0]?.evaluate((node) => node.getAttribute('src'));

                      const tiny_cover = await content[0]?.$x('./div[2]/img');
                      __data.tiny_cover = await tiny_cover[0]?.evaluate((node) => node.getAttribute('src'));

                      const developer = await content[0]?.$x('./div[2]/table/tbody/tr[1]/td[2]/b/a');
                      __data.developer = await developer[0]?.evaluate((node) => node.textContent);

                      const developer_url = await content[0]?.$x('./div[2]/table/tbody/tr[1]/td[2]/b/a');
                      __data.developer_url = await developer_url[0]?.evaluate((node) => node.getAttribute('href'));
                      __data.developer_url = __data.developer_url?.startsWith('/')
                        ? `https://retroachievements.org${__data.developer_url}`
                        : __data.developer_url;

                      const publisher = await content[0]?.$x('./div[2]/table/tbody/tr[2]/td[2]/b/a');
                      __data.publisher = await publisher[0]?.evaluate((node) => node.textContent);

                      const publisher_url = await content[0]?.$x('./div[2]/table/tbody/tr[2]/td[2]/b/a');
                      __data.publisher_url = await publisher_url[0]?.evaluate((node) => node.getAttribute('href'));
                      __data.publisher_url = __data.publisher_url?.startsWith('/')
                        ? `https://retroachievements.org${__data.publisher_url}`
                        : __data.publisher_url;

                      const genre = await content[0]?.$x('./div[2]/table/tbody/tr[3]/td[2]');
                      __data.genre = await genre[0]?.evaluate((node) => node.textContent);

                      const release_date = await content[0]?.$x('./div[2]/table/tbody/tr[4]/td[2]/b');
                      __data.release_date = await release_date[0]?.evaluate((node) => node.textContent);

                      const previews = await content[0]?.$x('./div[3]/div/img');
                      __data.previews = [];
                      for (const preview of previews) {
                        __data.previews.push(await preview?.evaluate((node) => node.getAttribute('src')));
                      }

                      await page.waitForSelector('.achievementlist');
                      const achievements_table = await page.$('.achievementlist');
                      const achievements_rows = await achievements_table[0]?.$x('./tbody/tr');
                      __data.achievements = [];

                      if (achievements_rows) {
                        for (const achievement_row of achievements_rows) {
                          const achievement = {};

                          const achievement_cells = await achievement_row?.$x('./td');
                          const achievement_name = await achievement_cells[0]?.$x('./div/div[2]/div[1]/div[1]/span/a');
                          const achievement_description = await achievement_cells[0]?.$x('./div/div[2]/div[1]/div[2]');
                          const achievement_badge = await achievement_cells[0]?.$x('./div/div[1]/span/a/img');
                          const achievement_url = await achievement_name[0]?.evaluate((node) => node.getAttribute('href'));

                          const achievement_progress = await achievement_cells[0]?.$x('./div/div[2]/div[2]/div[2]');
                          const achievement_progress_text = await achievement_progress[0]?.evaluate((node) => node.innerHTML);
                          const regex = /(\d+) <strong>\((\d+)\)<\/strong> of (\d+)<br>\((\d+.\d+)%\) players/;
                          const matches = regex.exec(achievement_progress_text);
                          const [total_players_with_achievement, total_players_with_achievement_hardcore, total_players, percentage] = matches?.slice(1);

                          achievement.name = await achievement_name[0]?.evaluate((node) => node.textContent);
                          achievement.description = await achievement_description[0]?.evaluate((node) => node.textContent);
                          achievement.badge = await achievement_badge[0]?.evaluate((node) => node.getAttribute('src'));
                          achievement.url = achievement_url.startsWith('/') ? `https://retroachievements.org${achievement_url}` : achievement_url;
                          achievement.stats = {
                            total: total_players,
                            total_with_achievement: total_players_with_achievement,
                            total_hardcore: total_players_with_achievement_hardcore,
                            percentage,
                          };

                          __data.achievements.push(achievement);
                        }
                      }
                      return __data;
                    },
                  });

                  await scraper.runTask(task_name);

                  _data.push({
                    title,
                    achievements,
                    points,
                    lastUpdated,
                    leaderboards,
                    url,
                  });
                }
              }

              return _data;
            },
          });
        }
      }

      return data;
    },
  });

  await scraper.run();
})();
