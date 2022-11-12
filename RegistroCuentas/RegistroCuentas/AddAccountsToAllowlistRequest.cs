using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RegistroCuentas
{
    public class AddAccountsToAllowlistRequest
    {
        public String Jsonrpc { get; set; }
        public String Method { get; set; }
        public List<List<String>> Params { get; set; }
        public int Id { get; set; }

        public AddAccountsToAllowlistRequest(List<List<String>> _params)
        {
            this.Jsonrpc = "2.0";
            this.Method = "perm_addAccountsToAllowlist";
            this.Params = _params;
            this.Id= 1;
        }
    }

}
