export default `<!DOCTYPE html>
<html lang=en>
<meta charset=UTF-8>
<head>
    <style>
        * {
            box-sizing: border-box;
            font-family: sans-serif
        }
    
        .key {
            font-size: 1.2rem;
            text-align: center;
            margin: auto;
            font-family: monospace;
            padding: .3em;
            cursor: text;
            width: 50%;
            display: block;
            overflow: scroll;
            background-color: #eee;
            color: #000;
            border: 1px solid #000
        }
    
        .warning {
            font-weight: 700
        }
    
        .key-selector {
            cursor: pointer;
            border: none
        }
    
    </style>
</head>
<body>
    <h1>Password reset for the Aurora API</h1>
    <p>Hello!
    <p>We received a request to reset your password.
    <p>To do so, the key to use in the API call is the following:</p><input class=key disabled value={{params.key}}>
    <p><span class=warning>Warning:</span> Do not share this code with anyone! It can be used to change your API password
    <p>If you did not request such reset and do not acknowledge this action, please ignore this email.</p>
</body>

</html>
`;
