let baseurl = window.location.origin; 

window.onload = () => 
{
    if (window.location.href === "http://localhost:4001/posts")
    {   
        document.getElementById("target").remove();
    } 
}

async function deletePost(element)
{
    const postId = element.value;

    const url = baseurl+'/post/destroy/'+postId;

    const options = {method: 'DELETE'};

    if(confirm("Are you sure you want to delete this post?"))
    {
        try 
        {
            const response = await fetch(url, options);

            if (!response.ok) 
            {
                if (response.redirected)
                {
                    location.reload();
                }
                else
                {
                    throw new Error('Network response was not ok');
                }
            }

        } 
        catch (error) 
        {
            console.error('There was a problem with the DELETE request:', error.message);
        }
    }
}
