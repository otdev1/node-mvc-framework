let baseurl = window.location.origin; 

window.onload = () =>
{
    if (window.location.href === baseurl+'/posts')
    {
        document.getElementById("target").remove();
    } 
}

async function deletePost(element)
{
    const postId = element.value;

    const url = baseurl+'/post/destroy/'+postId;

    const options = {
    method: 'DELETE'
    };

    try 
    {
        const response = await fetch(url, options);
        if (!response.ok) 
        {
            throw new Error('Network response was not ok');
        }

        console.log(response);
    } 
    catch (error) 
    {
        console.error('There was a problem with the DELETE request:', error.message);
    }
}
