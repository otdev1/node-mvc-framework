import { EOL } from 'os'; 
import Post from '../models/Post';
import { Client, Validators } from '../src/ModelHelpers';

import { log, error } from "console"; 

afterAll(async () => { return Client.end(); });

describe('constructors', () => {
  test('table name defined correctly', () => {
    const post = new Post();

    expect(post._tableName).toBe('posts');
  });

  test('default attributes defined correctly', () => {
    const post = new Post();

    expect(post.id).toBe(null);
    expect(post._attributes['id'].value).toBe(null);
    expect(post.createdAt).toBe(null);
    expect(post._attributes['createdAt'].value).toBe(null);
    expect(post.updatedAt).toBe(null);
    expect(post._attributes['updatedAt'].value).toBe(null);

    expect(post.title).toBe(null);
    expect(post._attributes['title'].value).toBe(null);
    expect(post.content).toBe(null);
    expect(post._attributes['content'].value).toBe(null);
  });

  test('validate hook', () => {
    const post = new Post();
  
    expect(post._validationHooks[0].attribute).toBe('title');
    expect(post._validationHooks[0].validator).toBe(Validators.PresenceOf);
  });

});

/* the test below will only pass when the synchronous version of the save() method is defined */
// describe('hooks', () => {
//   test('return false if not valid', () => {
//     const post = new Post();
//     let postSaved = post.save();

//     expect(postSaved).toBe(false);
//     expect(post.errors.length).toBe(1);
//     expect(post.errors[0]).toBe('title should be present.');
//   });

//   test('reload attributes', () => {
//     const post = new Post();
//     post.title = 'My new post';
//     post.content = 'Content here';
//     let postSaved = post.save();
  
//     expect(postSaved).toBe(true);
//     expect(post.errors.length).toBe(0);
//     expect(post._attributes['title'].value).toBe('My new post');
//     expect(post._attributes['content'].value).toBe('Content here');
//     expect(post._changedAttributes).toEqual(['title', 'content']);
//   });
  
//   test('reload attributes mass assignment', () => {
//     const post = new Post( {title: 'My new post', content: 'Content here'} );
//     let postSaved = post.save();
  
//     expect(postSaved).toBe(true);
//     expect(post.errors.length).toBe(0);
//     expect(post._attributes['title'].value).toBe('My new post');
//     expect(post._attributes['content'].value).toBe('Content here');
//     expect(post._changedAttributes).toEqual([]); // we have set as mass attributes, so nothing have changed
//   });

// });

describe('finders', () => {
  beforeAll(async () => {
    
    await Client.query(`INSERT INTO posts (title, content, createdAt, updatedAt) VALUES ('First post', 'My content', NOW(), NOW());`);

    await Client.query(`INSERT INTO posts (title, content, createdAt, updatedAt) VALUES ('Second post', 'My second content', NOW(), NOW());`);
  });

  afterAll(async () => {
    await Client.query('TRUNCATE TABLE posts RESTART IDENTITY;');
    
  });

  test('find a post with a valid ID', async () => {
    const post = await Post.find(1);
   
    expect(post._persisted).toBe(true);
    expect(post.id).toBe(1);
    expect(post.title).toBe('First post');
    expect(post.content).toBe('My content');
  });

  test('find first post', async () => {
    const post = await Post.first();

    expect(post._persisted).toBe(true);
    expect(post.id).toBe(1);
    expect(post.title).toBe('First post');
    expect(post.content).toBe('My content');
  });

  test('find last post', async () => {
    const post = await Post.last();

    expect(post._persisted).toBe(true);
    expect(post.id).toBe(2);
    expect(post.title).toBe('Second post');
    expect(post.content).toBe('My second content');
  });

});

describe('chaining finders', () => {
  beforeAll(async () => {
    for (let i = 0; i < 20; i++) {

      await Client.query(`INSERT INTO posts (title, content, createdAt, updatedAt) ` +
        `VALUES ('Post #${i+1}', 'Content here', NOW(), NOW());`);
    }
  });

  afterAll(async () => {
    await Client.query('TRUNCATE TABLE posts RESTART IDENTITY;');
  });

  test('Get the first 10 posts matching the correct order', async () => {

    const posts = await Post.limit(10).offset(0).orderBy('id ASC').all();
   
    const postsTitle = posts.map((post) => post.title);

    expect(postsTitle).toEqual(['Post #1', 'Post #2', 'Post #3', 'Post #4', 'Post #5',
    'Post #6', 'Post #7', 'Post #8', 'Post #9', 'Post #10']);
  });

  test('Get the last 10 posts matching the correct order', async () => {
    const posts = await Post.limit(10).offset(10).orderBy('id ASC').all();
    const postsTitle = posts.map((post) => post.title);

    expect(postsTitle).toEqual(['Post #11', 'Post #12', 'Post #13', 'Post #14', 'Post #15',
      'Post #16', 'Post #17', 'Post #18', 'Post #19', 'Post #20']);
  });

  test('Get the post by title', async () => {

    const posts = await Post.where("title = $1", 'Post #15').all();

    expect(posts.length).toBe(1);
    
    expect(posts[0].title).toBe('Post #15');
  });

  test('Get the post by title by object match', async () => {
    const posts = await Post.where({title: 'Post #15', content: 'Content here'}).all();

    expect(posts.length).toBe(1);
    expect(posts[0].title).toBe('Post #15');
  });

  test('Find the post by title by object match', async () => {
    const post = await Post.findBy({ title: 'Post #15', content: 'Content here' });

    expect(post.title).toBe('Post #15');
  });
});

describe('save/create/update/destroy', () => {
  afterAll(async () => {
    await Client.query('TRUNCATE TABLE posts RESTART IDENTITY;');
  });

  test('save a new object', async () => {
    const post = new Post({title: 'Post with save'});
    const postSaved = await post.save();

    expect(postSaved).toBe(true);
    expect(post.title).toBe('Post with save');
    expect(post.id).toBe(1);
  });

  test('save an existing object', async () => {
    const post = new Post({title: 'Post saved'});
    await post.save();
    const updatedAt = post.updatedAt;
    expect(post.id).toBe(2);
  
    post.title = 'New title';
    post.content = 'Updated content';
    const postUpdated = await post.save();
  
    expect(postUpdated).toBe(true);
    expect(post.id).toBe(2);
    expect(post.title).toBe('New title');
    expect(post.content).toBe('Updated content');

    expect(JSON.stringify(post.updatedAt)).not.toEqual(JSON.stringify(updatedAt));

  });

  test('destroy an existing object', async () => {
    const post = new Post({title: 'Third post'});
    await post.save();
  
    expect(post.id).toBe(3);
    const postsCount = (await Post.s_all()).length;

    expect(postsCount).toBe(3);
  
    await post.destroy();
    expect(post.id).toBe(null);
    expect(post.title).toBe(null);
  
    const postsCountUpdated = (await Post.s_all()).length;
   
    expect(postsCountUpdated).toBe(2);
  });

  test('Post.s_create static method', async () => {
    const post = await Post.s_create({title: 'Post.create'});
    const postsCount = (await Post.s_all()).length;
  
    expect(post.id).toBe(4);
    expect(post.title).toBe('Post.create');
    expect(postsCount).toBe(3); 
  });
  
});

describe('before and after save', () => {
  afterAll(async () => {
    await Client.query('TRUNCATE TABLE posts RESTART IDENTITY;');
  });

  test('beforeSave and afterSave hooks update data correctly', async () => {
    const post = await Post.s_create({title: 'Title', content: 'Content'});

    expect(post.title).toBe('-- Title');
    expect(post._attributes['title'].value).toBe('-- Title');
    expect(post.content).toBe('Content changed');
    expect(post._attributes['content'].value).toBe('Content'); 
  });
});
