import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import locale from './locales/locales.js';
import wiew from './view.js';
import ru from './locales/ru.js';
import parser from './parser.js';

const addProxy = (url) => {
  const urlWithProxy = new URL('/get', 'https://allorigins.hexlet.app');
  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', 'true');
  return urlWithProxy.toString();
};

const app = () => {
  const timeout = 5000;
  const lng = 'ru';
  const elements = {
    form: document.querySelector('form'),
    input: document.getElementById('url-input'),
    submitButton: document.querySelector('button[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
    modal: document.querySelector('.modal'),
    modalTitle: document.querySelector('.modal-title'),
    modalDescription: document.querySelector('.modal-body'),
    modalFullArticle: document.querySelector('.full-article'),
  };

  const validate = (url, links) => {
    const schema = yup.string()
      .required()
      .url()
      .notOneOf(links);
    return schema
      .validate(url)
      .then(() => { })
      .catch((error) => error.message);
  };

  const updateRSS = (state) => {
    const requests = state.feeds.map((feed) => axios.get(addProxy(feed.link))
      .then((response) => {
        const [, posts] = parser(response.data.contents);
        const postsFromState = state.posts.filter((post) => post.feedId === feed.id);
        const newPosts = _.differenceBy(posts, postsFromState, 'link');
        state.posts = [...newPosts, ...state.posts];
      })
      .catch((err) => console.log(err)));
    Promise.all(requests)
      .finally(() => {
        setTimeout(updateRSS, timeout, state);
      });
  };

  const defineError = (err) => {
    if (err.isAxiosError) {
      return 'networkError';
    }
    if (err.isParserError) {
      return 'parserError';
    }
    return 'unknowError';
  };

  const loadRSS = (url, state) => {
    axios.get(addProxy(url))
      .then((responce) => {
        const [feed, posts] = parser(responce.data.contents);
        feed.id = _.uniqueId();
        feed.link = url;
        state.feeds.push(feed);
        posts.forEach((post) => {
          post.id = _.uniqueId();
          post.feedId = feed.id;
        });
        state.posts = [...posts, ...state.posts];
        state.status = 'loaded';
        state.error = null;
      })
      .catch((err) => {
        state.error = defineError(err);
        state.status = 'failed';
      });
  };

  const i18n = i18next.createInstance();
  i18n.init({
    lng,
    resources: { ru },
  })
    .then(() => {
      yup.setLocale(locale);
      const initialState = {
        error: null,
        posts: [],
        feeds: [],
        shownPostId: null,
        shownPostsIds: new Set(),
      };
      const state = wiew(initialState, i18n, elements);
      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const url = new FormData(e.target).get('url').trim();
        const links = state.feeds.map(({ link }) => link);
        state.status = 'loading';
        validate(url, links)
          .then((error) => {
            if (error) {
              state.error = error;
              state.status = 'failed';
              return;
            }
            loadRSS(url, state);
          });
      });
      elements.posts.addEventListener('click', (e) => {
        const { target } = e;
        const { dataset: { id } } = target;
        if (id) {
          state.shownPostId = id;
          state.shownPostsIds.add(id);
        }
      });
      updateRSS(state);
    });
};

export default app;
