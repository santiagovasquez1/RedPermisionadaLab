using System.IO;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using System.Security.Cryptography;
using Newtonsoft.Json;
using System.Text;
using Nethereum.Web3.Accounts;
using System;
using RestSharp;
using System.Collections.Generic;

namespace RegistroCuentas
{
    public class RegistroCuentasFunction
    {
        private readonly ILogger<RegistroCuentasFunction> _logger;

        public RegistroCuentasFunction(ILogger<RegistroCuentasFunction> log)
        {
            _logger = log;
        }

        [FunctionName("RegistroCuentas")]
        [OpenApiOperation(operationId: "Run", tags: new[] { "name" })]
        [OpenApiSecurity("function_key", SecuritySchemeType.ApiKey, Name = "code", In = OpenApiSecurityLocationType.Query)]
        [OpenApiParameter(name: "name", In = ParameterLocation.Query, Required = true, Type = typeof(string), Description = "The **Name** parameter")]
        [OpenApiResponseWithBody(statusCode: HttpStatusCode.OK, contentType: "text/plain", bodyType: typeof(string), Description = "The OK response")]
        public async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = null)] RegistroRequest req)
        {
            _logger.LogInformation("C# HTTP trigger function processed a request.");
            string data = req.Nombre + req.Correo + req.Nit;
            StringBuilder privateKeyBuilder;

            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(data));
                privateKeyBuilder = new StringBuilder(bytes.Length * 2);

                for (int i = 0; i < bytes.Length; i++)
                {
                    privateKeyBuilder.AppendFormat("{0:x2}", bytes[i]);
                }

            }

            Account account = new Account("0x" + privateKeyBuilder.ToString());
            RegistroResponse registroResponse = new RegistroResponse(account.Address, privateKeyBuilder.ToString());

            RestClient restClient = new RestClient("http://node1:8540");
            restClient.AddDefaultHeader("Content-Type", "application/json; charset=utf-8");
            RestRequest request = new RestRequest();
            List<List<String>> accounts = new()
            {
                new List<String>(){account.Address}
            };

            AddAccountsToAllowlistRequest requestObject = new(accounts);
            request.AddJsonBody(requestObject);
            try
            {
                var response = await restClient.PostAsync(request);
                return new OkObjectResult(registroResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return new BadRequestObjectResult(ex.Message);
                throw;
            }


        }
    }
}

